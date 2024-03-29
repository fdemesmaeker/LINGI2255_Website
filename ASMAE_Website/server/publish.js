/*
  This file defines what the client should see or edit of the database
*/

var isStaffOrAdmin = function(nid){
    if(nid===undefined) return false;
      var user = Meteor.users.findOne(nid);
      if(user===undefined) return false;
      return (user.profile.isStaff || user.profile.isAdmin);
};

Meteor.publish('users', function () {
  var res = Meteor.users.find({});
  return res;
});

Meteor.publish('Courts', function(){
  return Courts.find();
});

Meteor.publish('Winners', function(){
  return Winners.find();
});

Meteor.publish('Addresses', function(){
      if(isStaffOrAdmin(this.userId)) {
        return Addresses.find();
      }
      var user = Meteor.users.findOne({_id:this.userId},{"profile.addressID":1});
      if (user===undefined) {
          return Addresses.find({"isCourtAddress":true});
      }
      return Addresses.find({$or:[{_id: user.profile.addressID}, {"isCourtAddress":true}]});
});

Meteor.publish('Questions', function(){
    if(isStaffOrAdmin(this.userId)){
          return Questions.find();
    }
    return Questions.find({userID: this.userId});
});

Meteor.publish('Threads', function(){
    if(isStaffOrAdmin(this.userId)){
          return Threads.find();
    }
    this.ready();
});

Meteor.publish('Topics', function(){
    if(isStaffOrAdmin(this.userId)){
          return Topics.find();
    }
    this.ready();
});

Meteor.publish('Extras', function(){
  return Extras.find();
});

Meteor.publish('GlobalValues', function(){
    var res = GlobalValues.find();
  return res;
});

Meteor.publish("Pairs", function () {
  var res = Pairs.find({});
  return res;
});

Meteor.publish("ModificationsLog", function(){
  return ModificationsLog.find({});
});

/************************************************
              ALLOWS
*************************************************/

var allowForStaffOrAdmin = {
  'insert': function (userId,doc) {
        /* user and doc checks ,
        return true to allow insert */
        return isStaffOrAdmin(userId);
  },
  'update': function (userId,doc) {
        /* user and doc checks ,
        return true to allow update */
        return isStaffOrAdmin(userId);
  },
  'remove': function (userId,doc) {
        /* user and doc checks ,
        return true to allow remove */
        return isStaffOrAdmin(userId);
  }
};

Pools.allow(allowForStaffOrAdmin);

Types.allow(allowForStaffOrAdmin);

Courts.allow({
  'insert': function (userId,doc) {
        /* user and doc checks ,
        return true to allow insert */
        if(isStaffOrAdmin(userId)) return true;
        return userId===doc.ownerID;
  },
  'update': function (userId,doc) {
        /* user and doc checks ,
        return true to allow update */
        if(isStaffOrAdmin(userId)) return true;
        return userId===doc.ownerID;
  },
  'remove': function (userId,doc) {
        /* user and doc checks ,
        return true to allow remove */
        if(isStaffOrAdmin(userId)) return true;
        return userId===doc.ownerID;
  }
});

Pairs.allow(allowForStaffOrAdmin);

GlobalValues.allow(allowForStaffOrAdmin);

/*  Known uses : client/scoreTable  */
Matches.allow(allowForStaffOrAdmin);

Meteor.users.deny({'update':function(userId, doc){return !isStaffOrAdmin(userId)}});


Meteor.publish("Pools", function(){
  return Pools.find({},{});
});

Meteor.publish("Years", function(){
  return Years.find({},{});
});

Meteor.publish("Types", function(){
  return Types.find({},{});
});

Meteor.publish("Matches", function(){
  return Matches.find({},{});
});


/*
* Only publish the pair needed. Publish nothing if player does not belong to the pair.
* Known uses : client/myRegistration
*/
Meteor.publish("PairsInfo", function(){
    var id = this.userId;
    pairs = getPairsFromPlayerID(this.userId, true);
    if (!pairs) {
        this.ready();
    }
    return pairs;
});

/*
* Only publish the address of the partner. Publish nothing if player does not belong to the pair.
* Known uses : client/myRegistration
*/
Meteor.publish("PartnersAdresses", function() {
    var id = this.userId;
    var pairs = getPairsFromPlayerID(this.userId);
    if (!pairs) {
        this.ready();
        return;
    }
    var user1, user2;
    for (var i=0; i<pairs.length; i++) {
        var pair = pairs[i];
        if(pair.player1 && pair.player1._id == id){
            user1 = Meteor.users.findOne({_id:pair.player1._id});
          }
          else if(pair.player2 && pair.player2._id == id){
            user1 = Meteor.users.findOne({_id:pair.player2._id});
          }
          if(pair.player1 && pair.player1._id != id){
            user2 = Meteor.users.findOne({_id:pair.player1._id});
          }
          else if(pair.player2 && pair.player2._id != id){
            user2 = Meteor.users.findOne({_id:pair.player2._id});
          }
          if(!user2) {
              //console.error("Error publish PartnerAdress : you do not have a partner in this pair (user2)");
              var addrID1 = user1.profile.addressID;
          var addr1 = Addresses.findOne({_id:addrID1});
          this.added('Addresses',addrID1,addr1);
          }
        else if(!user1) {
          //console.error("Error publish PartnerAdress : you do not have a partner in this pair (user1)");
          var addrID2 = user2.profile.addressID;
          var addr2 = Addresses.findOne({_id:addrID2});
          this.added('Addresses',addrID2,addr2);
        }
        else {
          var addrID1 = user1.profile.addressID;
          var addr1 = Addresses.findOne({_id:addrID1});
          this.added('Addresses',addrID1,addr1);
          var addrID2 = user2.profile.addressID;
          var addr2 = Addresses.findOne({_id:addrID2});
          this.added('Addresses',addrID2,addr2);
        }
    }

  this.ready();

});


Meteor.publish('Payments', function(){
  var id = this.userId;
  if(isStaffOrAdmin(id)){
      return Payments.find();
  }
  else{
    return Payments.find({userID: id});
  }
});
