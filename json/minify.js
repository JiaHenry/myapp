const SpecialValueDictionary = {
    null: "\x03",
    undefined: "\x04"
};

/** 
     * @template T
*/
class ValueIndexMap {
    /** @type T[] */
    #unique = [];
    /** @type Object.<string, number> */
    #indexMap = {};
    /** 
     * @param {T} value
     * @return {string}
    */
    #getKeyByValue(value) {
        return value?.toString();
    }

    /** 
     * @param {T} value
     * @return {string}
    */
    getKey(value) {
        return value == null ? SpecialValueDictionary[value] : this.#getKeyByValue(value);
    }

    get keys() {
        return Object.keys(this.#indexMap);
    }

    /** 
     * @param {T} value
    */
    push(value) {
        let key = this.getKey(value);
        let index = this.#indexMap[key];
        if (index === undefined) {
            index = this.#unique.length;
            this.#unique.push(value);
            this.#indexMap[key] = index;
        }
        return index;
    }

    /** 
     * @param {number} index
    */
    getValueByIndex(index) {
        return this.#unique[index];
    }

    get values() {
        return this.#unique.slice();
    }

    /** 
     * @param {T[]} values
    */
    adjustValues(values) {
        return values.map((v) => this.push(v));
    }

    /** 
     * @param {T[]} values
    */
    addValues(values) {
        values.forEach((v) => this.push(v));
    }

    /** 
     * @param {T} value
    */
    getIndexOfValue(value) {
        let key = this.getKey(value);
        return this.#indexMap[key];
    }
}

/**
 * @template T
 * @param {T[]|Object.<string, T>} target 
 * @param {string|number} key 
 * @param {T} defaultValue 
  * @returns {T}
 */
function ensureObject(target, key, defaultValue) {
    if (!target[key]) {
        target[key] = defaultValue;
    }
    return target[key];
}

/**
 * 
 * @param {Object.<string, any>[]} dataArray 
 * @returns 
 */
function miniArray(dataArray) {
    /** @type Object.<string, ValueIndexMap<any>> */
    const map = {};
    /** @type ValueIndexMap<string>> */
    const propMap = new ValueIndexMap();
    const data = dataArray.map((v) => {
        /** @type number[] */
        const result = [];
        for(const key in v) {
            const index = propMap.push(key);
            const valueMap = ensureObject(map, index, new ValueIndexMap());
            result[index] = valueMap.push(v[key]);
        }
        return result;
    });
    const restoreData = data.map(v => {
        /** @type Object.<string, any> */
        const d = {}; 
        for(const key in v) {
            d[propMap.getValueByIndex(+key)] = map[key].getValueByIndex(v[key]);
        }
        return d;
    });
    const [s1, s2] = [JSON.stringify(dataArray), JSON.stringify(restoreData)];
    if (s1.length === s2.length) {
        console.log("Same length and same value?", s1 === s2);
    } else {
        console.log("Dif", s1, s2);
    }
    return { map,data, propMap };
}

const demoData = require("./chartdata.json");

miniArray(demoData.values);