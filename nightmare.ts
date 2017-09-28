import * as Nightmare from 'nightmare';
import * as locutus from 'locutus';
import { date } from 'locutus/php/datetime';



const c = require('cheerio');
let argv = require('yargs').argv;
declare var document;



export class MyNightmare extends Nightmare {
    ua = {
        firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0",
        chrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36"
    };
    constructor(defaultOptions) {
        super(defaultOptions);

    }
    firefox() {
        this.useragent(this.ua.firefox);
    }
    chrome() {
        this.useragent(this.ua.chrome);
    }

    /**
     * Returns jQuery object of the site's HTML.
     * 
     * @param url url of the site to get jQuery of it.
     * @return - cheerio(jQuery) object
     * 
     * @code
     *      $html = await nightmare.get('https://philgo.com/etc/phpinfo.php?dummay=1');
     * @endcode
     * 
     * 
     * @note since Nightmare does not redirect(reload) the current page,
     *  you can simply do below and it will not load 'url-a' twice.
     * 
     * @code
     *          .goto('url-a')
     *          .get('url-a')
     * @endcode
     * 
     * 
     * 
     */
    async get(url) {
        let html = await this
            .goto(url)
            .evaluate(() => document.querySelector('html').innerHTML)
            .then(a => a);
        // console.log('html: ', html);
        let $html = c.load(html)('html');
        return $html;
    }
    /**
     * Returns cheerio object of curent page's HTML.
     */
    async getHtml() {
        let html = await this
            .evaluate(() => document.querySelector('html').innerHTML)
            .then(a => a);
        let $html = c.load(html)('html');
        return $html;
    }


    /**
     * Waits for selector and test if selector exstis.
     * @param selector selector to wait and check
     * @param message message to display
     */
    async waitTest(selector: string, message) {
        await this.wait(selector);
        let $html = await this.getHtml();
        this.test($html.find(selector).length > 0, message);
    }
    test(re, message) {
        if (re) this.success(message);
        else this.failure(message);
    }
    success(message) {
        console.log("SUCCESS : " + message);
    }
    failure(message) {
        console.log("FAILURE : " + message);
        //this._exit('App will close.');
    }
    nextAction(message) {
        console.log("NEXT ACTION : " + message);
    }
    get argv() {
        return argv;
    }

    async enter(selector) {
        return await this.type(selector, "\x0d");
    }


    /**
     * Types into the selector.
     * @param selector selector
     * @param str string to input
     */
    async typeEnter(selector, str) {
        await this.type(selector, str);
        await this.enter(selector);
    }
    /**
     * Types a string into the selector box and waits until wait seletor appears.
     */
    async typeEnterWait(type, str, wait) {
        await this.typeEnter(type, str);
        await this.wait(wait);
    }

    async clickWaitTest(click, wait, msg) {
        await this.click(click);
        await this.waitTest( wait, msg );
    }


    async _exit(msg='') {
        // console.log(msg);
        // await nightmare.then();
        // await nightmare.end();
        if ( msg ) console.log(msg);
        process.exit(0);
    }


    /**
     * Waits until the selector disappears.
     * @use
     *      - when you do not know what will appear next page,
     *      - you only know that some in this page will disappear if page chages.
     * 
     * @param selector Selector to be disappears.
     * @param timeout timeout. defualt 30 seconds.
     * 
     * @code
     *     let re = await nightmare.waitDisappear( passwordField );
            if ( re ) {
                console.log("You are NOT in login page");
            }
            else {
                console.log("You are STILL in login page");
            }
            await nightmare.wait( 'body' );
     * @endcode
     */
    async waitDisappear(selector: string, timeout = 30) {
        let $html = null;
        let maxWaitCount = timeout * 1000 / 100;
        for (let i = 0; i < maxWaitCount; i++) {
            await this.wait(100);
            $html = await this.getHtml();
            if ($html.find(selector).length == 0) return true;
        }
        return false;
    }


    /**
     * 
     * @todo Is this method really different from 'wait()'? Except this method wait 0.1 seconds before checking selector.
     * 
     * Waits until the selector appears.
     * @use
     *      - when you do not know what will appear next page,
     *      - you only know that some in this page will disappear if page chages.
     * 
     * @param selector Selector to be disappears.
     * @param timeout timeout. default 30 seconds.
     * 
     * @code
     *     let re = await nightmare.Appear( selector );
            await ( re ) ? await nightmare.success("Post found") 
                 : await nightmare.failure("Post not found");
     * @endcode
     */
    async waitAppear(selector: string, timeout = 30) {
        let $html = null;
        let maxWaitCount = timeout * 1000 / 100;
        for (let i = 0; i < maxWaitCount; i++) {
            await this.wait(100);
            $html = await this.getHtml();
            if ($html.find(selector).length > 0) return true;
        }
        return false;
    }
    /**
     * - returns sequence of emojis based on timestamp in millisec generated by generateID()
     */
    get generatePostId() {
        let splitId = this.generateId().split('');
        let arr = []
        splitId.forEach(async element => {
            arr.push(this.transformCharacter(element));
        });
        return arr.join(' ');
    }

    private generateId(): string {
        return Date.now().toString();
    }
    private transformCharacter(val) {
        switch (val) {
            case '0': return '+';
            case '1': return '-';
            case '2': return '=';
            case '3': return '/';
            case '4': return '*';
            case '5': return '_';
            case '6': return '^';
            case '7': return '#';
            case '8': return '@';
            case '9': return '!';
        }
    }

    /**
     * Wait until either of the 2 selector exist
     * @usa
     *      - when you are expecting the page to show something on the same page
     *      - and at the same time you also expect another event may trigger
     *      ex.
     *      - you are waiting for an popup but you also expect the page will change
     *      - its either success or failed scenario
     *      - which event will comes first
     */
    async waitSelectorExist(trueSelector, falseSelector, timeout=30) {
        let $html = null;
        let maxWaitCount = timeout * 1000 / 100;
        for (let i = 0; i < maxWaitCount; i++) {
            await this.wait(100);
            $html = await this.getHtml();
            if ($html.find(trueSelector).length > 0) return true;
            if ($html.find(falseSelector).length > 0) return false;
        }
        return false;
    }

    date(format?: any, timestamp?: any): any {
        return date(format, timestamp);
    }
}
