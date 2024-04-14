import { semver } from 'bun';

import { FixedInterval } from '../common/fixed-interval';
import { ONE_HOUR } from '../../util/constants';

import { GITHUB_API_URL, SOURCE_REPO, VERSION_REGEX } from './constants';
import { AggregatorInformation, GitTreeBranchResponse } from './types';
import { TypeNavigator } from './navigator';
import { filter } from 'fuzzy';

export default class VersionAggregator {
  static #lastFetch: number;
  static _latestRelease?: string;
  static #ready: boolean = false;

  static get ready() {
    return this.#ready;
  }

  static #interval: FixedInterval;

  static #releases: string[];
  static #branches: string[];
  static #navigators: Map<string, TypeNavigator>;

  static #endpoint = `${GITHUB_API_URL}/repos/${SOURCE_REPO}/git/trees/docs` as const;

  static {
    this.#setupInterval();
  }

  static get debug(): AggregatorInformation {
    const self = this;
    return {
      ready: this.#ready,
      branches: this.#branches.length,
      versions: this.#releases.length,
      navigatorCount: this.#navigators.size,
      lastFetch: this.#lastFetch,
      get lastFetchAt() {
        return new Date(self.#lastFetch);
      },
      latest: this.latestRelease
    };
  }

  static get latestRelease() {
    if (!this.#ready) return null;

    if (!this._latestRelease) {
      this._latestRelease = this.#releases[0];
    }

    return this._latestRelease;
  }

  static get releases() {
    if (!this.#ready) return [];
    return this.#releases.slice();
  }

  static get branches() {
    if (!this.#ready) return [];
    return this.#branches.slice();
  }

  static get all() {
    if (!this.#ready) return [];
    return [].concat(this.branches, this.releases);
  }

  static filter(query: string) {
    return filter(query, this.all);
  }

  static getTag(tag: string): TypeNavigator | undefined {
    if (this.all.includes(tag) && !this.#navigators.has(tag)) {
      this.#navigators.set(tag, new TypeNavigator(tag));
    }

    return this.#navigators.get(tag);

    // otherwise... not my problem - which also caches if the class isn't ready
  }

  static #setupInterval(force: boolean = true) {
    if (this.#interval && !force) return;

    this.#interval = new FixedInterval(ONE_HOUR, 0, false, this.refresh.bind(this));
    this.refresh();
  }

  static async refresh() {
    this.#ready = false;

    const res = await fetch(this.#endpoint);
    const data: GitTreeBranchResponse = await res.json();

    delete this._latestRelease;
    this.#lastFetch = Date.now();
    this.#branches = [];
    this.#releases = [];
    this.#navigators = new Map();

    for (const node of data.tree) {
      if (node.path.includes('dependabot')) continue;
      if (!node.path.endsWith('.json')) continue;

      const tag = node.path.slice(0, -5);
      const isRelease = VERSION_REGEX.test(tag);

      const array = isRelease ? this.#releases : this.#branches;
      array.unshift(tag);

      console.debug(`Found ${isRelease ? 'release' : 'branch'} ${tag}`);
    }

    this.#releases.sort((v1, v2) => semver.order(v2.slice(1), v1.slice(1)));
    this.#ready = true;
  }

  static destroy() {
    this.#interval.destroy();
    this.#ready = false;
  }
}
