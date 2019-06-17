export class Player {
    name:string;
    private totalDamage=0;
    constructor(name:string) {
        this.name=name;
    }
    get damage() {return this.totalDamage}

    hit(level:number) { this.totalDamage+=2*level}
    addShield() { throw Error('no implemented');}
}