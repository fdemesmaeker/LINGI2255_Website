Template.selectNewCourt.events({
    'click .courtRow' : function(event){
    		var courts = event.currentTarget.lastElementChild.innerText;
    		Session.set("selectNewCourt/courts",courts);
    	
    		$('#chooseCourtsModal').modal('show');
     }
});

Template.chooseCourtsModal.helpers({
    'CourtsNumber': function(){

    	var courts = Session.get("selectNewCourt/courts",courts);
    	var courtsArray = courts.split(',');
    	return courtsArray;
    }
  });

Template.chooseCourtsModal.events({
    'click .valid': function(event){

    	var courtNumber = document.getElementById("selectCourt").value

    	var poolId = Session.get("PoolList/poolID");

    	var pool = Pools.findOne({_id:poolId});
    	pool.courtId = parseInt(courtNumber);

    	Meteor.call('updatePool',pool);

    	Session.set("PoolList/ChosenCourt","");
    }
  });