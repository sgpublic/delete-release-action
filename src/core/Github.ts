import * as github from '@actions/github';
import {Input} from "./Input";
import {RestEndpointMethods} from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types";

export class Github {
    private readonly octokit: RestEndpointMethods;

    private constructor() {
        this.octokit = github.getOctokit(Input.Github.TOKEN).rest;
    }

    private releases: any | null = null
    public async listRelease(): Promise<any> {
        if (this.releases == null) {
            this.releases = (await this.octokit.repos.listReleases(Input.Github.REPO)).data;
        }
        return this.releases
    }

    public async dropRelease(id: any) {
        for (const release of (await this.listRelease()).filter(
            (release: { id: any; }) => release.id === id,
        )) {
            for (const asset of release.assets) {
                await this.octokit.repos.deleteReleaseAsset(Object.assign(
                    Input.Github.REPO, { asset_id: asset.id }
                ))
            }
            await this.octokit.repos.deleteRelease(Object.assign(
                Input.Github.REPO, { release_id: release.release_id }
            ));
        }
    }

    private static instance: Github | null = null;

    public static getInstance(): Github {
        if (this.instance == null) {
            this.instance = new Github();
        }
        return this.instance;
    }
}