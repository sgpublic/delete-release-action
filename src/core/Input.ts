import * as core from '@actions/core';
import * as github from '@actions/github';

export class Input {
    public static Github = class {
        public static get TOKEN(): string {
            return core.getInput("token");
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
    }

    public static PreRelease = class {
        public static get DROP(): boolean {
            return core.getBooleanInput("pre-release-drop");
        }
        public static get KEEP_COUNT(): number {
            return Number(core.getInput("pre-release-keep-count"));
        }
    }

    public static Draft = class {
        public static get DROP(): boolean {
            return core.getBooleanInput("draft-drop");
        }
    }
}