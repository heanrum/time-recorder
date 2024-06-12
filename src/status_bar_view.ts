import { window, StatusBarItem, StatusBarAlignment } from 'vscode';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as mom from "moment";
const moment = require("moment").default || require("moment");

export class ActivityNameBar {
    private statusBar: StatusBarItem | undefined;
    private preActivityName : string | undefined;
    private activityDoing : boolean = false;
    private activityDoingLable = "[Start]";

    public updateActivityName() {
        if (!this.statusBar) {
            this.statusBar = window.createStatusBarItem(StatusBarAlignment.Right);
        }

        this.statusBar.text = 'Start An Activity';
        this.tryResumeAnActivity();

        let showInputBoxCommand = vscode.commands.registerCommand('time-recorder.showInputBoxCommand', async () => {
            if(!this.activityDoing){
                this.startAnActivity();
            }
            else
            {
                vscode.window.showInformationMessage(`Stop or Start A New Activity?`, 'Only Stop', 'Start A New').then(selection => {
                    this.finishAnActivity();
                    if (selection === 'Start A New') {
                        this.startAnActivity();
                    }
                });
            }
        });

        this.statusBar.command = 'time-recorder.showInputBoxCommand';
        this.statusBar.show();
    }

    private tryResumeAnActivity()
    {
        const filePath = vscode.workspace.getConfiguration('time-recorder').get<string>('filepath');
        if(filePath && filePath !== ''){
            fs.readFile(filePath!, 'utf-8', (err, data) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed Open File ${filePath}`);
                }
                else
                {
                    const str = data.substring(data.length-this.activityDoingLable.length);
                    if(str === this.activityDoingLable)
                    {
                        this.preActivityName = data.substring(data.lastIndexOf(":")+1, data.lastIndexOf(`${this.activityDoingLable}`)).trim();
                        if(this.preActivityName)
                        {
                            this.statusBar!.text = this.preActivityName+' Doing';
                            this.activityDoing = true;
                        }
                    }
                }
            });
        }
    }

    private async startAnActivity()
    {
        this.preActivityName = await vscode.window.showInputBox({ placeHolder: 'Input An Activity Name' });
        if(this.preActivityName)
        {
            this.statusBar!.text = this.preActivityName+' Doing';
            this.activityDoing = true;
            this.writeFile(`\n- ${this.formatDate(moment())}:${this.preActivityName}\t${this.activityDoingLable}`);
        }
    }

    private finishAnActivity()
    {
        this.activityDoing = false;
        this.statusBar!.text = 'Start An Activity';
        this.writeFile(`\n- ${this.formatDate(moment())}:${this.preActivityName}\t[End]`);
    }

    private writeFile(msg : string)
    {
        const filePath = vscode.workspace.getConfiguration('time-recorder').get<string>('filepath');
        if(filePath && filePath !== ''){
            fs.appendFile(filePath!, msg, err => {
                if (err) {
                    vscode.window.showErrorMessage('Failed Record');
                } else {
                    vscode.window.showInformationMessage(`Successfully Record ${this.preActivityName}`);
                }
            });
        }
    }

    private formatDate(mt: moment.Moment)
    {
        return `${mt.format('HH:mm:ss')}`;
    }
}
