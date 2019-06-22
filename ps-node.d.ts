declare module 'ps-node' {
    function lookup(params:{}, 
                    fn:(err:string,resultList:string[])=>void):void;
    export = lookup;
}