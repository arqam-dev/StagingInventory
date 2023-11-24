'use strict';
let _ = require('lodash');
let genericResponse = require('../models-metadata/generic-response');

module.exports = function (CustomRole) {

  CustomRole.createCustomRole = async function (data) {

    let isRoleAlreadyExists = await CustomRole.find({
      where: {
        name: data.name
      }
    });
    if (_.isNull(isRoleAlreadyExists)) {
      return genericResponse.failure();
    } else {
      let customRoleObj = await CustomRole.create({
        name: data.name,
        description: data.description
      });
      let models = CustomRole.app.models();
      let acl = CustomRole.app.models.Permission;

      // If the is no entry in the ACL table, set DENY to $everyone.
      let aclAll = await acl.findOne(); // SELECT 1 FROM table LIMIT 1;
      if (_.isEmpty(aclAll)) {
        for (let i = 0; i < models.length; i++) {

          await acl.create({
            model: models[i].name,
            property: '*',
            accessType: 'EXECUTE',
            permission: 'DENY',
            principalType: 'ROLE',
            principalId: '$everyone',
          });
        }
      }

      // let models = CustomRole.app.models();
      // models.forEach(async function (Model) {
      //   // modelArr.push(Model.name);
      //   // console.log('I am here at this line');
      //   console.log(Model.name);
      //   console.log(++count);

      // //   await acl.create({
      // //     model: Model.name,
      // //     property: '*',
      // //     accessType: 'READ',
      // //     permission: 'DENY',
      // //     principalType: 'ROLE',
      // //     principalId: user.name,
      // //     moduleListId: '0',
      // //   });
      // //   await acl.create({
      // //     model: Model.name,
      // //     property: '*',
      // //     accessType: 'WRITE',
      // //     permission: 'DENY',
      // //     principalType: 'ROLE',
      // //     principalId: user.name,
      // //     moduleListId: '0',
      // //   });
      // });

      for (let i = 0; i < models.length; i++) {

        if (data.name === 'Super Admin') {
          await acl.create({
            model: models[i].name,
            property: '*',
            accessType: '*',
            permission: 'ALLOW',
            principalType: 'ROLE',
            principalId: data.name,
          });
        } else {}
      }
      //

      return genericResponse.success();;
    }
  };

  CustomRole.showAllRoles = async function () {

    let allRoleObj = await CustomRole.find();
    return allRoleObj;
  };

  async function updatePermissions(modelObj) {
    console.log('updatePermissions function called...!');
    // console.log('modelObj within the function');
    // console.log(modelObj);
    let moduleList = CustomRole.app.models.ModuleList;
    let moduleListObjArr = await moduleList.find({
      where: {
        name: modelObj.moduleName
      },
      include: [{
        relation: 'modelLists',
        scope: {
          include: [{
            relation: 'endPoints',
          }],
        }
      }],
    });

    let moduleListObj = moduleListObjArr[0].toJSON(); // There will be only one module here
    let modelsArr = moduleListObj.modelLists;
    console.log('moduleListObj in the function');
    console.log(moduleListObj);
    let endPointName = moduleListObj.modelLists[0].endPoints[0].name;
    console.log('endPointName: ' + endPointName);
    let acl = CustomRole.app.models.Permission;
    let aclObj = await acl.find({
      where: {
        model: modelObj.modelName,
        property: endPointName,
        principalId: modelObj.roleName,
        moduleType: modelObj.accessType
      }
    });
    let permission = 'DENY';
    let accessType;
    if (_.isEmpty(aclObj)) {
      console.log('aclObj is empty');
      if (modelObj.isRead && modelObj.isWrite) {
        await acl.create({
          model: modelObj.modelName,
          property: endPointName,
          accessType: 'EXECUTE',
          permission: 'ALLOW',
          principalType: 'ROLE',
          principalId: modelObj.roleName,
          moduleName: modelObj.moduleName,
          moduleType: modelObj.moduleType
        });
      }else if(modelObj.isRead && !modelObj.isWrite){
        if(modelObj.moduleType === 'GET'){
          await acl.create({
            model: modelObj.modelName,
            property: endPointName,
            accessType: 'EXECUTE',
            permission: 'ALLOW',
            principalType: 'ROLE',
            principalId: modelObj.roleName,
            moduleName: modelObj.moduleName,
            moduleType: modelObj.moduleType
          });
        }
      }else if(!modelObj.isRead && modelObj.isWrite){
        if(modelObj.moduleType === 'POST'){
          await acl.create({
            model: modelObj.modelName,
            property: endPointName,
            accessType: 'EXECUTE',
            permission: 'ALLOW',
            principalType: 'ROLE',
            principalId: modelObj.roleName,
            moduleName: modelObj.moduleName,
            moduleType: modelObj.moduleType
          });
        }
      }
    } else {
      console.log('aclObj is not empty');
      // console.log('aclObj');
      // console.log(aclObj);
      if (!modelObj.isRead && !modelObj.isWrite) {
        // console.log('aclObj.id: ' + aclObj[0].id);
        await acl.destroyById(aclObj[0].id);
      } else {
        await acl.updateAll({
          id: aclObj[0].id
        }, {
          permission: permission
        });
      }
    }
    return true;
  }

  CustomRole.upsertRolePermissions = async function (data) {
    let acl = CustomRole.app.models.Permission;
    data.forEach(async obj => {
      let aclObj;
      let moduleList = CustomRole.app.models.ModuleList;

      let moduleObj = await moduleList.find({
        where: {
          name: obj.moduleName
        }
      });
      let isModel = _.find(moduleObj).isModel;
      if (!isModel) {
        console.log('Module doesnot has models');
        // turn off/on the descendants models permissions based on Get/Post
        // .. .. ..
        console.log('moduleObj.id: ' + moduleObj[0].id);

        let moduleListObjArr = await moduleList.find({
          where: {
            id: moduleObj[0].id
          },
          include: [{
            relation: 'moduleLists',
            scope: {
              include: [{
                relation: 'moduleLists',
              }],
            }
          }],
        });
        // console.log('moduleListObjArr');
        // console.log(moduleListObjArr[0].toJSON());
        let leafModulesArr = [];

        moduleListObjArr.forEach(levelFirstElementsObj => {
          // console.log('levelFirstElementsObj');
          // console.log(levelFirstElementsObj);
          if (levelFirstElementsObj.isModel) {
            leafModulesArr.push({
              moduleName: levelFirstElementsObj.name,
              moduleId: levelFirstElementsObj.id,
              moduleType: levelFirstElementsObj.type
            });
          }
          levelFirstElementsObj = levelFirstElementsObj.toJSON();
          // console.log(abc);
          levelFirstElementsObj.moduleLists.forEach(levelSecondElementsObj => {
            if (levelSecondElementsObj.isModel) {
              console.log('levelSecondElementsObj');
              leafModulesArr.push({
                moduleName: levelSecondElementsObj.name,
                moduleId: levelSecondElementsObj.id,
                moduleType: levelSecondElementsObj.type
              });
            }
            // levelSecondElementsObj = levelSecondElementsObj.toJSON();
            levelSecondElementsObj.moduleLists.forEach(levelThirdElementsObj => {
              console.log('levelThirdElementsObj');
              if (levelThirdElementsObj.isModel) {
                leafModulesArr.push({
                  moduleName: levelThirdElementsObj.name,
                  moduleId: levelThirdElementsObj.id,
                  moduleType: levelThirdElementsObj.type
                });
              }
            });
          });
        });
        console.log('leafModulesArr');
        console.log(leafModulesArr);
        leafModulesArr.forEach(async modelObj => {
          let model = CustomRole.app.models.ModelList;
          let modelObjTemp = await model.find({
            where: {
              moduleId: modelObj.moduleId
            }
          });
          let modelName = await _.find(modelObjTemp).name;
          obj.modelName = modelName;
          obj.name = modelName; // replacing the name of parent module with leaf module name
          console.log('obj.modelName: ' + modelName);
          let objNew = {
            moduleId: obj.moduleId,
            moduleName: modelObj.moduleName, // 
            roleName: obj.roleName,
            isRead: obj.isRead,
            isWrite: obj.isWrite,
            description: obj.description,
            isModel: obj.isModel,
            modelName: modelName,
            moduleType: obj.moduleType
          }
          console.log(objNew);
          // if ((obj.moduleType === 'GET' && obj.isRead) || (obj.moduleType === 'POST' && obj.isWrite)) {
          await updatePermissions(objNew);
          // }
        });
        // hv to create acl entry of empty module
        // .. .. ..
      } else {
        console.log('Module has models');
        let model = CustomRole.app.models.ModelList;
        let modelObj = await model.find({
          where: {
            moduleId: obj.moduleId
          }
        });
        console.log('obj.moduleId: ' + obj.moduleId);
        let modelName = await _.find(modelObj).name;
        obj.modelName = modelName;
        console.log('obj.modelName: ' + modelName);
        await updatePermissions(obj); // Simple model passing
      }
    });

    return true;

  };

};
