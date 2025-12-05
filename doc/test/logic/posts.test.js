const { postText } = require('../../../application/logic/posts');
const { postPhotoLocal } = require('../../../application/logic/posts');

const Post = require('../../../application/functions/classes/Post');
const Group = require('../../../application/functions/classes/Group');
const Notification = require('../../../application/functions/classes/Notification');

const Functions = require('../../../application/functions/functions');
const fileFunctions = require('../../../application/functions/fileFunctions');
const uploadFunctions = require('../../../application/functions/uploadFunctions');

jest.mock('../../../application/functions/classes/Post');
jest.mock('../../../application/functions/classes/Group');
jest.mock('../../../application/functions/classes/Notification');
jest.mock('../../../application/functions/fileFunctions');
jest.mock('../../../application/functions/uploadFunctions');


// Mock DB connection
jest.mock('../../../application/functions/conn.js', () => ({
  getConnection: () => ({
    query: jest.fn((query, values, callback) => {
      callback(null, { insertId: 123 });
    }),
  }),
}));

// Mock Group and Notification classes
jest.mock('../../../application/functions/classes/Group');
jest.mock('../../../application/functions/classes/Notification');

// Inject mock into Post.createPostText
Post.createPostText = jest.fn(async (req) => ({
  outcome: 200,
  newPost: { postID: 123, postCaption: req.body.postCaption }
}));

Group.getGroupUsers.mockResolvedValue({ groupUsers: ['userA', 'userB'] });
Notification.createGroupNotification.mockImplementation(() => {});

describe('postText()', () => {
  it('should return a 200 success response with a new post', async () => {
    const req = {
      body: {
        masterSite: "kite",
        postType: "text",
        postFrom: "user123",
        postTo: "group456",
        groupID: 1,
        listID: 2,
        postCaption: "Hello World",
        notificationMessage: "New post!",
        notificationType: "post",
        notificationLink: "/post/123"
      }
    };

    const res = {
      json: jest.fn()
    };

    await postText(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      statusCode: 200,
      message: "You made a Text post!"
    }));
  });
});


describe('postPhotoLocal()', () => {
    it('should handle successful photo upload and return post outcome', async () => {
      const { postPhotoLocal } = require('../../../application/logic/posts');
      const uploadFunctions = require('../../../application/functions/uploadFunctions');
      const Post = require('../../../application/functions/classes/Post');
      const Group = require('../../../application/functions/classes/Group');
      const Notification = require('../../../application/functions/classes/Notification');
      const fileFunctions = require('../../../application/functions/fileFunctions');
  
      // Mock req and res
      const req = {
        body: {
          groupID: 1,
          postFrom: 'user123',
          notificationMessage: 'msg',
          notificationType: 'type',
          notificationLink: 'link'
        },
        file: {
          mimetype: 'image/jpeg',
          originalname: 'photo.jpg',
          filename: 'photo-123.jpg'
        }
      };
  
      // Mock upload to call callback with no error (success)
      const originalUpload = uploadFunctions.uploadPostPhotoLocal;
      uploadFunctions.uploadPostPhotoLocal = (req, res, cb) => {
        process.nextTick(() => cb(null));
      };
  
      // Mock fileFunctions.handleUploadResult to return a success object
      fileFunctions.handleUploadResult = jest.fn(() => ({
        uploadSuccess: true,
        message: "Success",
        statusCode: 200
      }));
  
      // Mock Post.createPostPhoto to return a successful outcome
      Post.createPostPhoto = jest.fn(async () => ({
        outcome: 200,
        newPost: { postID: 123 }
      }));
  
      // Mock Group.getGroupUsers and Notification.createGroupNotification
      Group.getGroupUsers = jest.fn(async () => ({ groupUsers: [] }));
      Notification.createGroupNotification = jest.fn();
  
      // Await the async result using a Promise
      await new Promise((resolve) => {
        const res = {
          json: (data) => {
            expect(data).toEqual(expect.objectContaining({
              success: true,
              message: "Your photo was posted!",
              statusCode: 200,
              data: expect.objectContaining({ postID: 123 })
            }));
            resolve();
          }
        };
        postPhotoLocal(req, res);
      });
  
      // Restore original
      uploadFunctions.uploadPostPhotoLocal = originalUpload;
    });
  });
