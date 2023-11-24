'use strict';

module.exports = function (EndPoint) {

  EndPoint.showEndPointsListAgainstModel = async function (modelName) {

    console.log('modelName: ' + modelName);
    let allModelArr = await EndPoint.app.models();
    let modelNameObj;
    await allModelArr.forEach(model => {
      if(model.name === modelName){
        modelNameObj = model;
        // break;
      }
    });
    // for(let i = 0; i < allModelArr.length; i++){
    //   if(model === modelName){
    //     modelNameObj = model;
    //     // break;
    //   }
    // }
    let endPointsArr = [];
    await modelNameObj.sharedClass.methods().forEach(function (endPointsObjTemp) {
      endPointsArr.push({
        name: endPointsObjTemp.name
      });
    });
    return endPointsArr;
  }
};
