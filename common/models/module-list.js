'use strict';
let genericResponse = require('../models-metadata/generic-response');

module.exports = function (ModuleList) {

  ModuleList.createModule = async function (data) {

    let isModel = false;
    if (!(_.isEmpty(data.modelName)) && !(_.isEmpty(data.endPointName))) {
      isModel = true
    }
    let moduleObj = await ModuleList.create({
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      isModel: isModel,
      type: data.moduleListType // This is the type of endPoint actually. It is plpaced hhere to get in 'data' from client side
    });

    let modelList = ModuleList.app.models.ModelList;
    let endPoint = ModuleList.app.models.EndPoint;

    if (isModel) {
      let modelObj = await modelList.create({
        name: data.modelName,
        moduleId: moduleObj.id
      });

      await endPoint.create({
        name: data.endPointName,
        modelId: modelObj.id
      });
    } else {
      let acl = ModuleList.app.models.Permission;
      await acl.create({
        moduleName: data.name
      });
    }

    return genericResponse.success();
  }

  ModuleList.showModulesList = async function () {

    let modulesObj = await ModuleList.find({
      where: {
        parentId: 0
      }
    });
    return modulesObj;
  }
};
