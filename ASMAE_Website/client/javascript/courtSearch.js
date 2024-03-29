/*
  This file allows displays a table with different filters to search through the registered courts.
*/
Template.mySpecialFilterCourt.events({
    'keyup .courtFilter':function(event){
        privInput = event.currentTarget.value;
        Session.set("courtSearch/input", privInput);
    }
});

Template.allCourtsTable.onRendered(function(){
    Session.set("courtSearch/saturday",Session.get("selectNewCourt/saturday"));
    Session.set("courtSearch/sunday",Session.get("selectNewCourt/sunday"));
    Session.set("courtSearch/staffOK",Session.get("selectNewCourt/staffOK"));
    Session.set("courtSearch/ownerOK",Session.get("selectNewCourt/ownerOK"));
    Session.set("courtSearch/input","");
})


Template.allCourtsTable.helpers({
    courtsCollection: function () {
        var input = Session.get("courtSearch/input");
        if(input!==undefined){
          input = input.toLowerCase();
        }

        var saturday = Session.get("courtSearch/saturday");
        var sunday = Session.get("courtSearch/sunday");
        var owner = Session.get("courtSearch/ownerOK");
        var staff = Session.get("courtSearch/staffOK");
        if (input===undefined || input === null) {
            input = "";
        }
        var noInput = input ==="" && saturday==="Ignore" && sunday==="Ignore" && staff==="Ignore" && owner==="Ignore";

        if(noInput) return Courts.find({});
        var inputArray = input.split(" ");

        var query = {$where: function(){
            if(saturday=="Yes"){
              if(!this.dispoSamedi) return false;
            }
            else if(saturday=="No"){
              if(this.dispoSamedi) return false;
            }

            if(sunday=="Yes"){
              if(!this.dispoDimanche) return false;
            }
            else if(sunday=="No"){
              if(this.dispoDimanche) return false;
            }

            if(staff=="Yes"){
              if(!this.staffOK) return false;
            }
            else if(staff=="No"){
              if(this.staffOK) return false;
            }

            if(owner=="Yes"){
              if(!this.ownerOK) return false;
            }
            else if(owner=="No"){
              if(this.ownerOK) return false;
            }

            var searchString = courtToString(this);

            if(this.isOutdoor===true){
              searchString+=" extérieur";
            }
            else{
              searchString+=" intérieur";
            }

            for(var i=0; i<inputArray.length;i++){
                if(searchString.indexOf(inputArray[i])==-1){
                    return false;
                }
            }
            return true;
            }
        };
        return Courts.find(query);
    },

    settings : function(){
      return {
        fields:[
          { key: 'ownerID', label: 'Propriétaire', fn: function(value, object){
            user= Meteor.users.findOne({_id:value},{"profile":1});
            if(user!==undefined && user!==null) return user.profile.firstName + " " + user.profile.lastName;
            else return "";
          }},
          { key: 'addressID', label: 'Adresse' , fn: function(value, object){
            addr = Addresses.findOne({"_id":value});
            if(addr!==undefined){
            var ret = ""
                    if(addr.street != undefined) {
                        ret = ret+addr.street + ", ";
                    }
                    if(addr.number != undefined) {
                        ret = ret+addr.number + ", ";
                    }
                    if(addr.box != undefined) {
                        ret = ret+addr.box + ", ";
                    }
                    if(addr.city != undefined) {
                        ret = ret+addr.city + ", ";
                    }
                    if(addr.zipCode != undefined) {
                        ret = ret+addr.zipCode + ", ";
                    }
                    if(addr.country != undefined) {
                        ret = ret+addr.country;
                    }
                    return ret;
            }
            return "";
          }},
          { key: 'surface', label: "Surface"},
          { key: 'dispoSamedi', label:"Samedi", tmpl:Template.dispoSaturdayLabel},
          { key: 'dispoDimanche', label:"Dimanche", tmpl:Template.dispoSundayLabel},
          { key: 'ownerOK', label:"OK Proprio", tmpl:Template.ownerOKLabel},
          { key: 'staffOK', label:"OK Staff", tmpl:Template.staffOKLabel},
          { key: 'isOutdoor', label:'Extérieur', tmpl:Template.isOutdoorLabel},
          { key: 'courtType', label:"Type"},
          { key: 'instructions', label:"Instructions", hidden:true},
          { key: 'ownerComment', label:"Commentaire propriétaire", hidden:true},
          { key: 'staffComment', label:"Commentaire staff", hidden:true},
          { key: 'courtNumber', label:"Numéros", fn:function(value, object){
              if(value==null) return "";
              return value.join(", ");
          }}
      ],
             filters: ['NomDeFamille'],
             rowClass: "courtRow",
             showColumnToggles:true
      }
    }
});

Template.courtSearchTemplate.events({
    'click .courtRow' : function(event){
          Router.go('courtInfoPage',{_id:this._id});
    },
})

Template.courtSearch.events({
    'change #saturdaySelect':function(event){
      Session.set("courtSearch/saturday",event.currentTarget.value);
    },

    'change #sundaySelect':function(event){
      Session.set("courtSearch/sunday",event.currentTarget.value);
    },

    'change #ownerOKSelect':function(event){
      Session.set("courtSearch/ownerOK",event.currentTarget.value);
    },

    'change #staffOKSelect':function(event){
      Session.set("courtSearch/staffOK",event.currentTarget.value);
    },
});

Template.courtSearch.helpers({
    'setSelect':function(value,pos){

        if(pos==="Ignore"){
          if(value!=null) return "";
          else{
            return "selected";
          } 
        }
        else if(pos==="Yes"){
          if(value!=null && value==true){
            return "selected";
          } 
          else return "";
        }
        else{
          if(value!=null && value==true || value==null) return "";
          else{
            return "selected";
          }
        }
    }
});

