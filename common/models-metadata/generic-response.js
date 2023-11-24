'use strict';


function success() {
  return {
    isSuccess: true
  }
}

function failure() {
  return {
    isSuccess: false
  }
}

module.exports = {
  success,
  failure
};
