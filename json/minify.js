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

    toJSON() {
        // return JSON.stringify({ values: this.values, map: this.#indexMap });
        return JSON.stringify(this.values);
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
    // const restoreData = data.map(v => {
    //     /** @type Object.<string, any> */
    //     const d = {}; 
    //     for(const key in v) {
    //         d[propMap.getValueByIndex(+key)] = map[key].getValueByIndex(v[key]);
    //     }
    //     return d;
    // });
    const restoreData = restoreAsArray({ map, data, propMap });
    const [s1, s2] = [JSON.stringify(dataArray), JSON.stringify(restoreData)];
    if (s1.length === s2.length) {
        console.log("Same length and same value?", s1 === s2);
    } else {
        console.log("Dif", s1, s2);
    }
    return { map, data, propMap };
}

/**
 * 
 * @param { Object<string, any> } obj 
 * @param { ValueIndexMap<string> } map 
 * @param { number } level
 * @param { Object.<string, any> } result
 */
function miniObject(obj, map, level, result) {
    /** @type Object.<number, Object.<string, string>> */
    const m2 = {};
    for(const key in obj) {
        const index = map.push(key);
        const item = ensureObject(m2, index, {});
        item[index] = key;
        const v = obj[key];
        if (Array.isArray(v)) {
            result[index] = miniArray(v);
        } else {
            const sType = typeof v;
            if (sType === "object") {
                miniObject(v, map, level + 1, result);
            } else {
                result[index] = v;
            }
        }
    }
}

function restoreObject(obj, target, parsedFromJson) {
    const props = obj.props;
    for(const key in obj) {
        const num = +key;
        if (!isNaN(num)) {
            target[props[num]] = restoreValue(obj[key], parsedFromJson);
        }
    }
}

function restoreValue(v, parsedFromJson) {
    if (v && v.map && v.propMap) {
        return restoreAsArray(v, parsedFromJson);
    } else {
        return v;
    }
}

function restoreAsArray(v, parsedFromJson) {
    const {data, map, propMap} = v;

    if (parsedFromJson) {
        const mapObj = {};
        for(const key in map) {
            mapObj[+key] = JSON.parse(map[key]);
        }
        const propsArray = JSON.parse(propMap);
        return data.map(array => {
            /** @type Object.<string, any> */
            const d = {}; 
            array.forEach((v, index) => {
                d[propsArray[index]] = mapObj[index][v];
            });
            return d;
        });
    } else {
        return data.map(v => {
            /** @type Object.<string, any> */
            const d = {}; 
            for(const key in v) {
                d[propMap.getValueByIndex(+key)] = map[key].getValueByIndex(v[key]);
            }
            return d;
        });
    }
}

const demoData = require("./chartdata.json");
const jsonStr = JSON.stringify(demoData);
console.log("JSON length", jsonStr.length);
// miniArray(demoData.values);
/** @type ValueIndexMap<string> */
const map = new ValueIndexMap();
/** @type Object.<string, any> */
const miniObj = {};
miniObject(demoData, map, 0, miniObj);

miniObj.props = map.values;
console.log("map:", JSON.stringify(map));
console.log("result:", JSON.stringify(miniObj));
const str = JSON.stringify(miniObj);
console.log(str.length, str);

const checkObj = {};
restoreObject(miniObj, checkObj);
console.log("check restore", jsonStr === JSON.stringify(checkObj));

const checkObj2 = {};
restoreObject(JSON.parse(JSON.stringify(miniObj)), checkObj2, true);
// console.log("checkObj2:", checkObj2);
console.log("check restore from JSON", jsonStr === JSON.stringify(checkObj2));