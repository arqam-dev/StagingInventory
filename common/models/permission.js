'use strict';
let _ = require('lodash');

module.exports = function (Permission) {

  Permission.showAllPermissions = async function () {

    let permissionsObj = await Permission.find({
      where: {
        principalId: {
          neq: '$everyone'
        }
      },
      order: 'id ASC',
    });

    let customRole = Permission.app.models.CustomRole;
    let customRoleObj = await customRole.find();

    let moduleList = Permission.app.models.ModuleList;
    let moduleListObj = await moduleList.find({
      where: {
        parentId: 0
      }
    });

    // console.log('moduleListObj');
    // console.log(moduleListObj);
    let responseArr = [];
    let customRoleObjCounter = 0;
    await customRoleObj.forEach(async obj1 => {
      ++customRoleObjCounter;
      let tempArr = [];
      let tempArr1 = [];
      let moduleNameTempArr = [];
      permissionsObj.forEach(async obj2 => {
        if (obj1.name === obj2.principalId) {
          moduleNameTempArr.push({
            moduleName: obj2.moduleName
          });
          let permission = false;
          if (obj2.permission === 'ALLOW') {
            permission = true;
          }
          // let moduleListObj = moduleList.find({
          //   where: {
          //     name: obj2.moduleName
          //   }
          // });
          let isModel;
          let moduleId;
          moduleListObj.forEach(obj => {
            if (obj.name === obj2.moduleName) {
              isModel = _.find(moduleListObj).isModel;
              moduleId = obj.id;
            }
          });

          obj2.isRead = permission,
            obj2.isWrite = permission,
            obj2.isModel = isModel,
            obj2.moduleId = moduleId,
            // console.log('obj2');
            // console.log(obj2);
            tempArr.push(obj2);
        }
      });

      let counter = 0;
      moduleListObj.forEach(obj3 => {
        let isFound = false;
        // console.log(obj3.name)
        moduleNameTempArr.forEach(obj4 => {
          if (obj3.name === obj4.moduleName) {
            // console.log('isFound is true');
            isFound = true;
            ++counter;
            // break;
          }
        });
        if (!isFound) {
          ++counter;
          // console.log('ModuleName: ' + obj3.name + ' isFound: ' + isFound + ' RoleName: ' + obj1.name);

          // console.log('isFound is false');
          let model = Permission.app.models.ModelList;
          // console.log('obj3.id: ' + obj3.id);
          let modelObj = model.find({
            where: {
              moduleId: obj3.id
            }
          });
          // console.log('modelObj');
          // console.log(modelObj);
          let modelNameTemp;
          if (modelObj.length > 0) {
            // console.log('modelObj');
            // console.log(modelObj);
            modelNameTemp = modelObj[0].name;
          };
          let dummyObj = {
            model: modelNameTemp,
            property: '*',
            accessType: "*",
            permission: 'DENY',
            principalType: 'ROLE',
            principalId: obj1.name,
            moduleName: obj3.name,
            moduleId: obj3.id,
            isModel: obj3.isModel,
            id: obj3.id,
            isRead: false,
            isWrite: false,
            moduleType: obj3.type
          };
          // console.log('dummyObj');
          // console.log(dummyObj);
          tempArr.push(dummyObj);
        }
      });

      if (moduleListObj.length == counter) {
        // console.log('counter: ' + counter);
        // console.log(tempArr);
        let tempArrIdsArr = [];
        tempArr.forEach(idObj => {
          tempArrIdsArr.push(idObj.moduleId);
        });
        tempArrIdsArr = _.sortBy(tempArrIdsArr); //
        console.log('tempArrIdsArr');
        console.log(tempArrIdsArr);
        let tempArrSorted = [];
        let count = 0;
        tempArrIdsArr.forEach(async id => {
          ++count;
          // console.log('id: ' + obj.moduleId);
          tempArr.forEach(async obj => {
            // console.log('id1: ' + obj1.moduleId);
            if (id === obj.moduleId) {
              console.log('id: ' + id + ' id1: ' + obj.moduleId);
              // console.log('tempArrSorted obj1');
              // console.log(obj1);
              await tempArrSorted.push(obj); //
            }
          });
        });
        let objTemp = {
          roleName: obj1.name,
          PermissionsArr: tempArrSorted
        };
        await responseArr.push(objTemp);
      }
    });

    if (customRoleObj.length == customRoleObjCounter) {
      return await responseArr;
    }
  }
};
