'use strict';
import * as vscode from 'vscode';

export interface DebugCommands {
  serverAddress: string;
  serverPort: string;
}

export async function startDebugging(commands: DebugCommands): Promise<void> {
  let config: vscode.DebugConfiguration = {
    name: 'wpilibJavaDebug',
    type: 'java',
    request: 'attach',
    hostName: commands.serverAddress,
    port: commands.serverPort
  };

  await vscode.debug.startDebugging(undefined, config);
}
