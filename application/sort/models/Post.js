class Post {
    postID;
    postCaption = "I am a Post, yay!";
    postComments = [];

    constructor(postID) {
      this.postID = postID;
    }

    //Add a Comment
    addComment(comment) {
        this.postComments.push(comment);
    }
  
    //Method
    getPostLikes() {
      console.log("Post Likes");
    }
}


module.exports = Post


/*

export default class Example {
  test() {
    console.log('hello world');
  }
}
//POST
class Post {
    postMessage;
    postComments = [];

    constructor(postID) {
      this.postID = postID;
    }
    
    //Getter
    get postID() {
      return this.postID;
    }
    //Add a Comment
    addComment(comment) {
        this.postComments.push(comment);
    }
}

const post_one = new Post(1);
post_one.post_message = "hiya";
post_one.addComment("hiya!!");

const post_two = new Post(2);
post_two.post_message = "Post 2!!";
post_two.addComment("New comment! hiya!!");

console.log(post_one.post_id + " " + post_one.post_message + " " + post_one.comments);
console.log(post_two.post_id + " " + post_two.post_message + " " + post_two.comments);

user_comments = [post_one, post_two]

console.log(user_comments[0].comments[0]);
*/