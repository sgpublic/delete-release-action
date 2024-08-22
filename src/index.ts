import * as core from '@actions/core';
import {Github} from "./core/Github";
import {Input} from "./core/Input";

async function run() {
    const allReleases = await Github.getInstance().listReleases();
    core.debug(`Releases list data: \n${allReleases}`)
    if (allReleases.length <= 0) {
        core.info(`No releases found, action finished!`);
        return;
    }
    core.info(`Releases total count: ${allReleases.length}`);

    if (Input.Release.DROP) {
        const releases = allReleases.filter((release: any) => {
            (!release.draft && !release.prerelease)
        });
        if (releases.length > 0) {
            core.info(`Filtered release count: ${releases.length}`);
            await dropReleases(releases, Input.Release.KEEP_COUNT + 1, Input.Release.DROP_TAG);
        } else {
            core.warning(`No releases found, skip action.`);
        }
    } else {
        core.info(`Skip drop release.`);
    }

    if (Input.PreRelease.DROP) {
        const prereleases = allReleases.filter((release: any) => {
            (release.prerelease && !release.draft)
        });
        if (prereleases.length > 0) {
            core.info(`Filtered pre-release count: ${prereleases.length}`);
            await dropReleases(prereleases, Input.PreRelease.KEEP_COUNT + 1, Input.PreRelease.DROP_TAG);
        } else {
            core.warning(`No pre-releases found, skip action.`);
        }
    } else {
        core.info(`Skip drop pre-release.`);
    }


    if (Input.Draft.DROP) {
        const drafts = (await Github.getInstance().listReleases())
            .filter((release: any) => release.draft);
        if (drafts.length > 0) {
            core.info(`Filtered draft count: ${drafts.length}`);
            await dropReleases(drafts, Input.Draft.KEEP_COUNT + 1, false);
        } else {
            core.warning(`No drafts found, skip action.`);
        }
    } else {
        core.info(`Skip drop draft.`);
    }

    core.info(`All task finished!`);
}

async function dropReleases(releases: any, keep: number, dropTag: boolean) {
    const sorted = releases.sort(
        function (rA: any, rB: any) {
            if (rB.published_at != null && rA.published_at){
                return rB.published_at.localeCompare(rA.published_at);
            } else {
                return rB.name.localeCompare(rA.name);
            }
        },
    )
    const github = Github.getInstance();
    for (let i = keep; i < sorted.length; i++) {
        await github.dropRelease(sorted[i], dropTag);
    }
}

run();
