'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { IExternalAPI } from './externalapi';
import * as child_process from 'child_process';
import { DebugCommands, startDebugging } from './debug';

interface OutputPair {
    stdout: string;
    stderr: string;
}

function executeCommandAsync(command: string, rootDir: string, ow?: vscode.OutputChannel) : Promise<OutputPair> {
    return new Promise(function (resolve, reject) {
        let exec = child_process.exec;
        let child = exec(command, {
            cwd: rootDir
        }, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve({stdout: stdout, stderr: stderr});
            }
        });

        if (ow === undefined) {
            return;
        }

        child.stdout.on('data', (data) => {
            ow.append(data.toString());
        });

        child.stderr.on('data', (data) => {
            ow.append(data.toString());
        });
    });
}

async function gradleRun(args: string, rootDir: string, ow?: vscode.OutputChannel): Promise<OutputPair> {
    let command = 'gradlew ' + args;
    return await executeCommandAsync(command, rootDir, ow);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(_: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-wpilib-java" is now active!');

    let coreExtension = vscode.extensions.getExtension('wpifirst.vscode-wpilib-core');
    if (coreExtension === undefined) {
        vscode.window.showErrorMessage('Could not find core library');
        return;
    }

    let javaExtension = vscode.extensions.getExtension('vscjava.vscode-java-debug');
    if (javaExtension === undefined) {
        vscode.window.showErrorMessage('Could not find java extension');
        return;
    }

    let promises = new Array<Thenable<any>>();

    if (!javaExtension.isActive) {
        promises.push(javaExtension.activate());
    }

    if (!coreExtension.isActive) {
        promises.push(coreExtension.activate());
    }

    if (promises.length > 0) {
        await Promise.all(promises);
    }

    let coreExports: IExternalAPI = coreExtension.exports;

    let gradleChannel = vscode.window.createOutputChannel('gradleJava');

    if (vscode.workspace.rootPath === undefined) {
        return;
    }

    let wp: string = vscode.workspace.rootPath;

    coreExports.registerCodeDeploy({
        async getIsCurrentlyValid(): Promise<boolean> {
            return true;
        },
        async runDeployer(teamNumber: number): Promise<boolean> {
            let command = 'deploy --offline -PteamNumber=' + teamNumber;
            gradleChannel.show();
            let result = await gradleRun(command, wp, gradleChannel);
            console.log(result);
            return true;
        },
        getDisplayName(): string {
            return 'java';
        }
    });

    coreExports.registerCodeDebug({
        async getIsCurrentlyValid(): Promise<boolean> {
            return true;
        },
        async runDeployer(teamNumber: number): Promise<boolean> {
            let command = 'deploy --offline -PdebugMode -PteamNumber=' + teamNumber;
            gradleChannel.show();
            let result = await gradleRun(command, wp, gradleChannel);

            let config: DebugCommands = {
                serverAddress: '172.22.11.2',
                serverPort: '6667',
            };

            await startDebugging(config);

            console.log(result);
            return true;
        },
        getDisplayName(): string {
            return 'java';
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}
