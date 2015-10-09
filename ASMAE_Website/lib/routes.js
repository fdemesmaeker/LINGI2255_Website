Router.configure({
    layoutTemplate: 'index'
});

Router.route('/', {
    template: 'home',
    name: 'home'
});

Router.route('/contacts', {
	name: 'contacts',
	template: 'contacts'
});
Router.route('/pictures', {
	name: 'pictures',
	template: 'pictures'
});
Router.route('/rules', {
	name: 'rules',
	template: 'rules'
});
Router.route('/myRegistration', {
	name: 'myRegistration',
	template: 'myRegistration'
});
Router.route('/tournament-registration',  {
	name: 'tournamentRegistration',
	template: 'tournamentRegistration',
	onBeforeAction: function(){
        var currentUser = Meteor.userId();
        if(currentUser){
            this.next();
        } else {
            this.render("login");
        }
    }
});
Router.route('/court-registration', {
	name: 'courtRegistration',
	template: 'courtRegistration',
	onBeforeAction: function(){
        var currentUser = Meteor.userId();
        if(currentUser){
            this.next();
        } else {
            this.render("login");
        }
    }
});
Router.route('/court-info', {
	name: 'courtInfo',
	template: 'courtInfo',

	subscriptions: function(){
        return [ Meteor.subscribe('courts'), Meteor.subscribe('addresses') ]
    }
});
Router.route('/players-info', {
	name: 'playersInfo',
	template: 'playersInfo'
});
Router.route('/player-info-page', {
	name: 'playerInfoPage',
	template: 'playerInfoPage',
});
Router.route('/player-info-template', {
	name: 'playerInfoTemplate',
	template: 'playerInfoTemplate',
});
Router.route('/court-info-page', {
	name: 'courtInfoPage',
	template: 'courtInfoPage',
});
Router.route('/staff-management', {
	name: 'staffManagement',
	template: 'staffManagement'
});
Router.route('/profileEdit', {
	name: 'profileEdit',
	template: 'profileEdit'
});
Router.route('/brackets', {
	name: 'brackets',
	template: 'brackets'
});