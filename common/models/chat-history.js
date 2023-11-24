'use strict';

module.exports = function (ChatHistory) {

  ChatHistory.showChatMessagesOneToOne = async function (receiverId, customUserId) {
    console.log('receiverId: ' + receiverId);
    console.log('customUserId: ' + customUserId);

    var customUserIdTemp = receiverId;
    var receiverIdTemp = customUserId;
    let instance = await ChatHistory.find({
      where: {
        'or': [{
            'and': [{
                customUserId: customUserId,
              },
              {
                receiverId: receiverId,
              }
            ],
          },
          {
            'and': [{
                customUserId: customUserIdTemp,
              },
              {
                receiverId: receiverIdTemp,
              }

            ],
          },
        ],
      },
    });
    if (instance.length > 0) {
      let resp = {
        Response: instance
      };
      return resp;
    } else {
      let response = {
        isSuccess: false,
      };
      return response;
    }
  };
};
