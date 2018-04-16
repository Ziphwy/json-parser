function parse(str) {
  let i = 0;
  let len = str.length;
  
  function next(n = 1, ignore = ' ') {
    if (ignore) {
      while(i < len && str[i] === ignore) {
        i++;
      }
    }
    
    i += (n - 1);
    if (i < len) {
      return str[i++];
    } else {
      if (i === len) {
        return null;
      }
      throw RangeError();
    }
  }
  
  function lookAhead(n = 1, ignore = ' ') {
    let j = i;
    if (ignore) {
      while(j < len && str[j] === ignore) {
        j++;
      }
    }
    
    j += n - 1;
    if (j < len) {
      return str[j];
    } else {
      if (j === len) {
        return null;
      }
      throw RangeError();
    }
  }

  function fault(i, expect) {
    throw new Error(`at ${i - 1} " ${
      str.substring(i >= 4 ? i - 5 : 0, i)
    }... " expect a "${expect}" not "${str[i - 1]}"`);
  }

  function chars(s = '') {
    const w = next(1, null);
    if (w !== '"') {
      s += w;
      if (lookAhead(1, null) !== '"') {
        return chars(s);
      }
      return s;
    }
    fault(i - 1, 'char');
  }
    
  function string() {
    if (next() === '"') {
      let s = '';
      if (lookAhead() !== '"') {
        s = chars();
      } 
      if (next() === '"') {
        return s;
      }
      fault(i - 1, '"');
    }
    fault(i - 1, '"');
  }
  
  function digits(s = '', ignore) {
    const n = next(1, ignore);
    if (/\d/.test(n)) {
      s += n;
      if (/\d/.test(lookAhead(1, ignore))) {
        return digits(s, null);
      }
      return s;
    }
    fault(i - 1, 'digit');
  }
  
  function frac() {
    if (next() === '.') {
      return `.${digits()}`;
    }
    fault(i - 1, '.')
  }
  
  function int() {
    const ahead = lookAhead();
    if (/\d/.test(ahead)) {
      if (ahead === '0') {
        next();
        return '0';
      } else {
        return digits();
      }
    }
    
    if (next() === '-') {
      if (lookAhead() === '0') {
        next();
        return '-0';
      } else {
        return `-${digits()}`;
      }
    }
    
    fault(i, ['digit', '0'].join('" or "'));
  }
  
  function number() {
    let n = int();
    if (lookAhead() === '.') {
      n += frac();
    }
    return Number(n);
  }
  
  function value() {
    const ahead = lookAhead();
    if (ahead === '[') {
      return array();
    }
    if (ahead === '{') {
      return object();
    }
    if (/[-\d]/.test(ahead)) {
      return number();
    }
    if (ahead === 't') {
      if (str.substr(i, 4) === 'true') {
        next(4);
        return true;
      }
      fault(i, 'rue');
    }
    if (ahead === 'f') {
      if (str.substr(i, 5) === 'false') {
        next(5);
        return false;
      }
      fault(i, 'alse');
    }
    if (ahead === 'n') {
      if (str.substr(i, 4) === 'null') {
        next(4);
        return null;
      }
      fault(i, 'ull');
    }
    if (ahead === '"') {
      return string();
    }
    fault(i, ['{', '[', '"', 'true', 'false', 'null', 'digit'].join('" or "'));
  }
  
  function pair() {
    const s = string();
    if (next() !== ':') {
      fault(i - 1, ':');
    }
    const v = value();
    return {
      [s]: v
    };
  }
  
  function members(o = {}) {
    Object.assign(o, pair());
    if (lookAhead() === ',') {
      next()
      members(o);
    }
    return o;
  }
  
  function object() {
    let o = {};
    if (next() === '{') {
      if (lookAhead() === '"') {
        o = members();
      }
      if (next() === '}') {
        return o;
      }
      fault(i - 1, '}');
    }
  }
  
  function elements(a = []) {
    a.push(value());
    if (lookAhead() === ',') {
      next();
      elements(a);
    }
    return a;
  }
  
  function array() {
    let a = [];
    if (next() === '[') {
      if (/[\d-ntf\[\{"]/.test(lookAhead())) {
        a = elements();
      }
      if (next() === ']') {
        return a;
      }
      fault(i - 1, ']')
    }
  }
  
  const v = value();
  if (i < len) {
    throw new Error();
  }
  return v;
}