export class Player {
    name: string;
    private totalDamage = 0;
    private shield = 0;
    constructor(name: string) {
        this.name = name;
    }
    get damage() { return this.totalDamage }

    hit(amount: number) {
        this.totalDamage += Math.max((amount - this.shield), 0);
        this.shield = Math.max(this.shield - amount / 2, 0);
    }
    addShield() { this.shield = 10 }


}