export class SiteAdapter {
    constructor() {
        if (this.constructor === SiteAdapter) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    match(url) {
        throw new Error("Method 'match()' must be implemented.");
    }

    getProblemStatement() {
        throw new Error("Method 'getProblemStatement()' must be implemented.");
    }

    getUserCode() {
        throw new Error("Method 'getUserCode()' must be implemented.");
    }

    getLanguage() {
        throw new Error("Method 'getLanguage()' must be implemented.");
    }

    getProblemName() {
        throw new Error("Method 'getProblemName()' must be implemented.");
    }
}
