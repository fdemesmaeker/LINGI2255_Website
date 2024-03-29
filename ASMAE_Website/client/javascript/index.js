/*
	This file defines helpers for the staff menu and for the populate database
*/
Template.index.helpers({
	'isHomePage' : function(){
		if(Router.current().route.getName() === 'home'){
			return 'homePage';
		}
		else
		{
			return '';
		}
	},

	'isTournamentPage':function(){
		if(Router.current().route.getName() === 'poolList'){
			return true;
		}
		else
		{
			return false;
		}
	},

	'isStaffMember': function(){
		if(Meteor.user())
		{
			return (Meteor.user().profile.isStaff || Meteor.user().profile.isAdmin);
		}
		else
		{
			return false;
		}
	},

	'isConnected': function(){
		if(Meteor.user())
		{
			return true;
		}
		else
		{
			return false;
		}
	},

	'contentPadding': function(){
		//if(Meteor.user())
		var showNavBar = Session.get('showNavBar');
		if(showNavBar)
		{
			return '';
		}
		else
		{
			return 'nomargin';
		}
	},

	'showNavBar': function(){
		 return Session.get('showNavBar');
	},

  	'fullSheets':function(){
    	return {full:true};
  	}

});

var anchorBool = false;

Template.index.events({

	'click .menuItem': function() {
		$(window).scrollTop(0);
	},

	'click #mobile-menu-button': function(){
			window.location.hash = anchorBool ? '#menu-mobile' : "#menu-mobile2";
			anchorBool = !anchorBool;
	},

'click #popdbtest' : function(event) {
		/*
		 * 2015 data
		 */
		var nMen2015 = [60, 0, 0, 0, 0, 0, 0];
		var nWomen2015 = [0, 0, 0, 0, 0, 0, 0];
		var nMixed2015 = [0, 0, 0, 0, 0, 0, 0];
		var nFamily2015 = 0;
		var nPairs2015 = [nMen2015,nWomen2015,nMixed2015,nFamily2015];
		var nAloneMen2015 = [0, 0, 0, 0, 0, 0, 0];
		var nAloneWomen2015 = [0, 0, 0, 0, 0, 0, 0];
		var nAloneMixed2015 = [0, 0, 0, 0, 0, 0, 0];
		var nAloneFamily2015 = 0;
		var nAlones2015 = [nAloneMen2015,nAloneWomen2015,nAloneMixed2015,nAloneFamily2015];

		var nCourtSaturday2015 = 0;
		var nCourtSunday2015 = 0;
		var nCourtBoth2015 = 30;
		var fill2015 = true;

		/*
		 * 2014 data
		 */
		var nUnregistered = 0;
		var nStaff = 1;
		var nAdmin = 1;

		var tournamentData2015 = {
			tournamentDate : new Date(2015,8,12),
			tournamentPrice : 10
		}
		var tournamentDataTab = [tournamentData2015];
		var nPairsTab = [nPairs2015];
		var nAlonesTab = [nAlones2015];
		var nCourtSaturdayTab = [nCourtSaturday2015];
		var nCourtSundayTab = [nCourtSunday2015];
		var nCourtBothTab = [nCourtBoth2015];
		var fillTab = [fill2015];

		Meteor.call("populateDB", tournamentDataTab, nPairsTab, nAlonesTab, nUnregistered, nCourtSaturdayTab, nCourtSundayTab, nCourtBothTab, nStaff, nAdmin, fillTab, true);
	}
});
