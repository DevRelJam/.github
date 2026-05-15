import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const websiteDir = process.env.WEBSITE_DIR || "website";
const profileReadmePath =
  process.env.PROFILE_README_PATH || "profile/README.md";
const assetDir = process.env.PROFILE_ASSET_DIR || "assets";

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(websiteDir, relativePath), "utf8"));
}

function escapeTable(value) {
  return String(value || "").replaceAll("|", "\\|");
}

function firstFutureEvent(events) {
  const now = Date.now();
  return events
    .filter((event) => Date.parse(event.startDate) >= now)
    .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))[0];
}

function copyBrandAsset(relativePath, outputName) {
  const source = join(websiteDir, "public", relativePath.replace(/^\//, ""));
  mkdirSync(assetDir, { recursive: true });
  copyFileSync(source, join(assetDir, outputName));
}

const siteContent = readJson("public/data/site.json");
const eventsContent = readJson("public/data/events.json");
const peopleContent = readJson("public/data/people.json");

copyBrandAsset(siteContent.site.brand.logo, "devreljam-avocado-logo.png");
copyBrandAsset(
  siteContent.site.brand.mark || siteContent.site.brand.logo,
  "devreljam-avocado-mark.png",
);

const site = siteContent.site;
const hero = siteContent.hero;
const nextEvent =
  firstFutureEvent(eventsContent.upcoming) || eventsContent.upcoming[0];
const speakerSample = peopleContent.speakers.slice(0, 8);

const upcomingSection = nextEvent
  ? `## Up Next

### ${nextEvent.name}

| Detail | Information |
| --- | --- |
| Date | ${escapeTable(nextEvent.date)} |
| Time | ${escapeTable(`${nextEvent.time} ${nextEvent.timezone}`)} |
| Location | ${escapeTable(nextEvent.location)} |
| Status | ${escapeTable(nextEvent.status)} |
| Register | [Luma event](${nextEvent.url}) |
| Repo | [${nextEvent.repo?.replace("https://github.com/DevRelJam/", "") || "Jam repo"}](${nextEvent.repo || "https://github.com/devreljam"}) |

${nextEvent.description}

**Agenda**

${nextEvent.agenda.map((item) => `- ${item}`).join("\n")}`
  : `## Up Next

The next DevRelJam is being planned. Follow the [Luma calendar](${eventsContent.calendarUrl}) for new dates.`;

const pastRows = eventsContent.past.items
  .map(
    (event) =>
      `| [${escapeTable(event.name)}](${event.repo || event.url}) | ${escapeTable(event.date)} | ${escapeTable(event.location)} | [Repo](${event.repo || "https://github.com/devreljam"}) | [Luma](${event.url}) |`,
  )
  .join("\n");

const cityRows = siteContent.cities.items
  .map(
    (city) =>
      `| ${escapeTable(city.name)} | ${escapeTable(city.status)} | ${escapeTable(city.detail)} |`,
  )
  .join("\n");

const speakerRows = speakerSample
  .map(
    (speaker) =>
      `| [${escapeTable(speaker.name)}](${speaker.profile}) | ${escapeTable(speaker.designation)} | ${escapeTable(speaker.event)} |`,
  )
  .join("\n");

const readme = `<!-- AUTO-GENERATED: Edit DevRelJam/devreljam.github.io public/data/*.json, then run .github/scripts/generate-profile-readme.mjs. -->

<p align="center">
  <a href="${site.url}">
    <img src="../assets/devreljam-avocado-logo.png" alt="DevRelJam avocado logo" width="420">
  </a>
</p>

# ${site.name}

${site.tagline}

${hero.body}

<p>
  <a href="${site.url}"><img src="https://img.shields.io/badge/Website-devreljam.space-111111?style=for-the-badge" alt="Website"></a>
  <a href="${eventsContent.calendarUrl}"><img src="https://img.shields.io/badge/Luma-Calendar-ff725e?style=for-the-badge" alt="Luma calendar"></a>
  <a href="${siteContent.speakerCta.cta.href}"><img src="https://img.shields.io/badge/Speakers-Sessionize-f7b733?style=for-the-badge" alt="Speaker submissions"></a>
  <a href="https://github.com/devreljam"><img src="https://img.shields.io/badge/GitHub-Jam_repos-1b1a17?style=for-the-badge&logo=github&logoColor=white" alt="GitHub repositories"></a>
</p>

## What Is DevRelJam?

${siteContent.about.paragraphs.join("\n\n")}

## What Makes A Jam Different?

${siteContent.about.highlights.map((item) => `- **${item.title}:** ${item.body}`).join("\n")}

${upcomingSection}

## Where We Jam

${siteContent.cities.description}

| City | Status | Detail |
| --- | --- | --- |
${cityRows}

## Public Repos

- [devreljam.github.io](https://github.com/DevRelJam/devreljam.github.io): the config-driven website for [devreljam.space](${site.url}).
- [jam-template](https://github.com/DevRelJam/jam-template): reusable structure for new city editions.
- Past Jam repos: source-of-truth playbooks, agendas, and references for earlier editions.

## Past Jams

${eventsContent.past.description}

| Jam | Date | Location | Repo | Luma |
| --- | --- | --- | --- | --- |
${pastRows}

## Featured People

${peopleContent.description}

| Speaker | Role | Jam |
| --- | --- | --- |
${speakerRows}

## Get Involved

- **Attend:** RSVP from the [DevRelJam Luma calendar](${eventsContent.calendarUrl}).
- **Speak:** Submit field-tested lessons through [Sessionize](${siteContent.speakerCta.cta.href}).
- **Host:** Start from the [Jam template](https://github.com/DevRelJam/jam-template) and adapt it to your city.
- **Follow along:** Watch this organization and share what would make the next Jam more useful.

## Code Of Conduct

DevRelJam is committed to a welcoming and inclusive environment. Please review the [Code of Conduct](https://github.com/DevRelJam/.github/blob/main/CODE_OF_CONDUCT.md) before participating in community spaces.

## Contact

DevRelJam is an initiative by [${siteContent.community.initiativeBy.name}](${siteContent.community.initiativeBy.href}).
`;

mkdirSync(dirname(profileReadmePath), { recursive: true });
writeFileSync(profileReadmePath, `${readme.trimEnd()}\n`);
