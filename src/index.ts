import * as core from '@actions/core';
import {Github} from "./core/Github";
import {Input} from "./core/Input";

async function run() {
    const release = (await Github.getInstance().listRelease());
    if (release.length <= 0) {
        core.info("No release found, action finish!")
        return
    }
    core.info("Release total count: " + release.length)

    if (Input.Release.DROP) {
        const releases = release.filter((release: { prerelease: boolean, draft: boolean }) => {
            (!release.draft && !release.prerelease)
        })
        if (release.length > 0) {
            core.info("Find release count: " + release.length)
            await dropRelease(releases, Input.Release.KEEP_COUNT + 1);
        } else {
            core.info("No release found, skip action.")
        }
    } else {
        core.info("Skip drop release.")
    }


    if (Input.PreRelease.DROP) {
        const releases = release.filter((release: { prerelease: boolean }) => release.prerelease)
        if (releases.length > 0) {
            core.info("Find pre-release count: " + release.length)
            await dropRelease(releases, Input.PreRelease.KEEP_COUNT + 1);
        } else {
            core.info("No pre-release found, skip action.")
        }
    } else {
        core.info("Skip drop pre-release.")
    }


    if (Input.Draft.DROP) {
        const releases = release.filter((release: { draft: boolean }) => release.draft)
        if (releases.length > 0) {
            core.info("Find draft count: " + release.length)
            await dropRelease(releases, 0);
        } else {
            core.info("No draft found, skip action.")
        }
    } else {
        core.info("Skip drop draft.")
    }

    core.info("All task finished!")
}

async function dropRelease(releases: any, keep: number) {
    const sorted = releases.sort(
        function (rA: { published_at: string; }, rB: { published_at: string; }) {
            return rB.published_at.localeCompare(rA.published_at);
        },
    )
    const github = Github.getInstance();
    for (let i = keep; i < sorted.length; i++) {
        await github.dropRelease(sorted[i].release_id);
    }
}

run();