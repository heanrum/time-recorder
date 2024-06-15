import { window, StatusBarItem, StatusBarAlignment } from 'vscode';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as mom from "moment";
import { resolveTxt } from 'dns';
const moment = require("moment").default || require("moment");

export class ActivityNameBar {
    private statusBar: StatusBarItem | undefined;
    private preActivityName : string | undefined;
    private activityDoing : boolean = false;
    private activityDoingLabel = "[Start]";
    private activityEndLabel = "[End]";

    public init() {
        if (!this.statusBar) {
            this.statusBar = window.createStatusBarItem(StatusBarAlignment.Right);
        }

        this.statusBar.text = 'Start An Activity';
        this.refreshActivityState();

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

    public refreshActivityState()
    {
        const filePath = vscode.workspace.getConfiguration('time-recorder').get<string>('filepath');
        if(filePath && filePath !== ''){
            fs.readFile(filePath!, 'utf-8', (err, data) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed Open File ${filePath}`);
                }
                else
                {
                    this.checkNewDay(data);
                    this.checkDoingActivity(data);
                    this.checkFinishActivity(data);
                }
            });
        }  
    }

    private checkNewDay(data : string)
    {
        let lastDay = this.getLastRecordDay(data, "## (\\d{4}-\\d{2}-\\d{2})");
        if(lastDay === null || moment().format('YYYY-MM-DD') > lastDay)
        {
            this.writeFile(`\n## ${moment().format('YYYY-MM-DD')}`, "start a new day!");
        }
    }

    private getLastRecordDay(input: string, pattern: string | RegExp): string | null {
        let lastMatch: string | null = null;
        let result: RegExpMatchArray | null;

        while((result = input.match(pattern)) !== null)
        {
            input = input.slice(input.lastIndexOf(result[0]) + result[0].length);
            lastMatch = result[result.length - 1];
        }
      
        return lastMatch;
    }

    private checkDoingActivity(data : string)
    {
        let str = data.substring(data.length-this.activityDoingLabel.length);
        if(str === this.activityDoingLabel)
        {
            this.preActivityName = data.substring(data.lastIndexOf(":")+1, data.lastIndexOf(`${this.activityDoingLabel}`)).trim();
            if(this.preActivityName)
            {
                this.statusBar!.text = this.preActivityName+' Doing';
                this.activityDoing = true;
                return;
            }
        }
    }

    private checkFinishActivity(data : string)
    {
        let str = data.substring(data.length-this.activityEndLabel.length);
        if(str === this.activityEndLabel)
        {
            this.statusBar!.text = 'Start An Activity';
            this.activityDoing = false;
            return;
        }
    }

    private async startAnActivity()
    {
        this.preActivityName = await vscode.window.showInputBox({ placeHolder: 'Input An Activity Name' });
        if(this.preActivityName)
        {
            this.statusBar!.text = this.preActivityName+' Doing';
            this.activityDoing = true;
            this.writeFile(`\n- ${this.formatDate(moment())}:${this.preActivityName}\t${this.activityDoingLabel}`, `start activity:${this.preActivityName}`);
        }
    }

    private finishAnActivity()
    {
        this.activityDoing = false;
        this.statusBar!.text = 'Start An Activity';
        this.writeFile(`\n- ${this.formatDate(moment())}:${this.preActivityName}\t${this.activityEndLabel}`, `finish activity: ${this.preActivityName}`);
    }

    private writeFile(recordMsg : string, infoMsg : string)
    {
        const filePath = vscode.workspace.getConfiguration('time-recorder').get<string>('filepath');
        if(filePath && filePath !== ''){
            fs.appendFile(filePath!, recordMsg, err => {
                if (err) {
                    vscode.window.showErrorMessage('Failed Record');
                } else {
                    vscode.window.showInformationMessage(infoMsg);
                }
            });
        }
    }

    private formatDate(mt: moment.Moment)
    {
        return `${mt.format('HH:mm:ss')}`;
    }
}
