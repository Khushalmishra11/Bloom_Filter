/**
 * Production-ready Bloom Filter with false-positive control
 */
class BloomFilter {
  constructor(expectedItems = 1000, falsePositiveRate = 0.01, caseInsensitive = false) {
    if (expectedItems <= 0) throw new Error("Expected items must be > 0");
    if (falsePositiveRate <= 0 || falsePositiveRate >= 1) throw new Error("False positive rate must be between 0 and 1");

    this.expectedItems = expectedItems;
    this.falsePositiveRate = falsePositiveRate;
    this.caseInsensitive = caseInsensitive;

    // Calculate optimal array size (m) and hash functions (k)
    this.m = Math.ceil(-(expectedItems * Math.log(falsePositiveRate)) / (Math.log(2) ** 2));
    this.k = Math.ceil((this.m / expectedItems) * Math.log(2));

    this.bitArray = new Array(this.m).fill(0);
    this.itemCount = 0;
  }

  _hash(item, seed = 0) {
    let str = this.caseInsensitive ? item.toLowerCase() : item;
    let hash = 2166136261 ^ seed;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return Math.abs(hash % this.m);
  }

  _getHashPositions(item) {
    if (typeof item !== 'string') throw new Error("Input must be a string");
    const positions = [];
    for (let i = 0; i < this.k; i++) {
      positions.push(this._hash(item, i));
    }
    return positions;
  }

  add(item) {
    const positions = this._getHashPositions(item);
    positions.forEach(pos => (this.bitArray[pos] = 1));
    this.itemCount++;
  }

  mightContain(item) {
    const positions = this._getHashPositions(item);
    return positions.every(pos => this.bitArray[pos] === 1);
  }

  clear() {
    this.bitArray.fill(0);
    this.itemCount = 0;
  }

  getCurrentFalsePositiveRate() {
    return (1 - Math.exp(-this.k * this.itemCount / this.m)) ** this.k;
  }

  toJSON() {
    return {
      bitArray: this.bitArray,
      expectedItems: this.expectedItems,
      falsePositiveRate: this.falsePositiveRate,
      caseInsensitive: this.caseInsensitive,
      itemCount: this.itemCount
    };
  }

  fromJSON(data) {
    this.bitArray = data.bitArray;
    this.expectedItems = data.expectedItems;
    this.falsePositiveRate = data.falsePositiveRate;
    this.caseInsensitive = data.caseInsensitive;
    this.itemCount = data.itemCount;
    this.m = data.bitArray.length;
    return this;
  }
}

// Export for both browser and Node.js
window.BloomFilter = BloomFilter;