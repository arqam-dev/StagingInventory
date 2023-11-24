'use strict';

module.exports = function (ModelList) {

  ModelList.showModelsList = async function () {

    let ModelListsObj = await ModelList.app.models();
    let ModelListsArr = [];
    ModelListsObj.forEach(ModelListsObjTemp => {
      ModelListsArr.push({
        name: ModelListsObjTemp.name
      });
    });
    return ModelListsArr;
  }

  ModelList.showModelsListAgainstModule = async function (moduleId) {

    let ModelListsObj = await ModelList.find({
      where: {
        moduleId: moduleId
      }
    });
    return ModelListsObj;
  }
};
