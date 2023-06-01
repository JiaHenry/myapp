const SpecialValueDictionary = {
    null: "\x03",
    undefined: "\x04"
};

class ValueIndexMap {
    #unique = [];
    #indexMap = {};

    #getKeyByValue(value) {
        return value?.toString();
    }

    getKey(value) {
        return value == null ? SpecialValueDictionary[value] : this.#getKeyByValue(value);
    }

    get keys() {
        return Object.keys(this.#indexMap);
    }

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

    getValueByIndex(index) {
        return this.#unique[index];
    }

    get values() {
        return this.#unique.slice();
    }

    adjustValues(values) {
        return values.map((v) => this.push(v));
    }

    addValues(values) {
        values.forEach((v) => this.push(v));
    }

    getIndexOfValue(value) {
        let key = this.getKey(value);
        return this.#indexMap[key];
    }
}

function ensureObject(target, key, defaultValue) {
    if (!target[key]) {
        target[key] = defaultValue;
    }
    return target[key];
}

function miniArray(dataArray) {
    const map = {};
    const propMap = new ValueIndexMap();
    const data = dataArray.map((v) => {
        const result = {};
        for(const key in v) {
            const index = propMap.push(key);
            const valueMap = ensureObject(map, index, new ValueIndexMap());
            result[index] = valueMap.push(v[key]);
        }
        return result;
    });
    const restoreData = data.map(v => {
        const d = {}; 
        for(const key in v) { 
            d[propMap.getValueByIndex(+key)] = map[+key].getValueByIndex(+v[key]);
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