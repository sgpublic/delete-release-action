import * as core from '@actions/core';
import * as github from '@actions/github';

function parseKeepCount(inputName: string): number {
    const raw = core.getInput(inputName);
    const value = Number(raw);
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
        throw new Error(`Invalid value for input '${inputName}': expected an integer, got '${raw}'.`);
    }
    return Math.max(value, -1);
}

export class Input {
    public static Github = class {
        public static get TOKEN(): string {
            const token = process.env.GITHUB_TOKEN;
            if (!token) {
                throw new Error("No GITHUB_TOKEN found. Pass `GITHUB_TOKEN` as env!");
            }
            return token;
        }

        public static get REPO(): { owner: string; repo: string } {
            const repo = core.getInput("repo");
            if (repo === "") {
                return github.context.repo;
            }
            const parts = repo.split("/");
            if (parts.length !== 2 || parts[0] === "" || parts[1] === "") {
                throw new Error("Invalid `repo` input. Expected format: `owner/repo`.");
            }
            const [owner, repoName] = parts;
            return { owner, repo: repoName };
        }
    };

    public static Release = class {
        public static get DROP(): boolean {
            return core.getBooleanInput("release-drop");
        }

        public static get KEEP_COUNT(): number {
            return parseKeepCount("release-keep-count");
        }

        public static get DROP_TAG(): boolean {
            return core.getBooleanInput("release-drop-tag");
        }
    };

    public static PreRelease = class {
        public static get DROP(): boolean {
            return core.getBooleanInput("pre-release-drop");
        }

        public static get KEEP_COUNT(): number {
            return parseKeepCount("pre-release-keep-count");
        }

        public static get DROP_TAG(): boolean {
            return core.getBooleanInput("pre-release-drop-tag");
        }
    };

    public static Draft = class {
        public static get DROP(): boolean {
            return core.getBooleanInput("draft-drop");
        }

        public static get KEEP_COUNT(): number {
            return parseKeepCount("draft-drop-count");
        }
    };
}
