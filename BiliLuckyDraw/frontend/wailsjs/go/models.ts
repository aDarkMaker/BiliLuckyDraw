export namespace lottery {
	
	export class User {
	    uid: number;
	    uname: string;
	
	    static createFrom(source: any = {}) {
	        return new User(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.uid = source["uid"];
	        this.uname = source["uname"];
	    }
	}

}

