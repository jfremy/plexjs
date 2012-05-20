module.exports = (function() {
    function makeSureIsArray(data, key) {
        // Make changes in place

        if(!data.hasOwnProperty(key)) {
            // Key not present, create empty array
            data[key] = new Array();
            return data;
        }
        if(Object.prototype.toString.call( data[key]) === '[object Array]' ) {
            // this is an array, we're good
            return data;
        } else {
            data[key] = [ data[key] ];
            return data;
        }
    }

    return {
        makeSureIsArray: makeSureIsArray
    }
})();