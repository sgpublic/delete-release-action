import * as core from '@actions/core';
import * as github from '@actions/github';

export class Input {
    public static Github = class {
        public static get TOKEN(): string {
            const githubToken = process.env.GITHUB_TOKEN;
            if (githubToken == undefined) {
                core.error("No GITHUB_TOKEN found. pass `GITHUB_TOKEN` as env!")
                process.exit(1);
                return ''
            }
            return githubToken;
        }
        public static get REPO(): { owner: string, repo: string } {
            const repo = core.getInput("repo");
            if (repo == "") {
                return github.context.repo;
            }
            const split = repo.split("/");
            return {
                owner: split[0],
                repo: split[1],
            }
        }
    }

    public static Release = class {
        public static get DROP(): boolean {
            return core.getBooleanInput("release-drop");
        }
        public static get KEEP_COUNT(): number {
            return Number(core.getInput("release-keep-count"));
        }
        public static get DROP_TAG(): boolean {
            return core.getBooleanInput("release-drop-tag");
        }
    }

    public static PreRelease = class {
        public static get DROP(): boolean {
            return core.getBooleanInput("pre-release-drop");
        }
        public static get KEEP_COUNT(): number {
            return Number(core.getInput("pre-release-keep-count"));
        }
        public static get DROP_TAG(): boolean {
            return core.getBooleanInput("pre-release-drop-tag");
        }
    }

    public static Draft = class {
        public static get DROP(): boolean {
            return core.getBooleanInput("draft-drop");
        }
    }
}