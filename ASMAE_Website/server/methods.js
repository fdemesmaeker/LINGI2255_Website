Meteor.methods({
	
	/*
		Returns true if the address addr is already a court address present in the DB.
	*/
	'addressExists' : function(addr){
		if(addr._id && Courts.find({addressID:addr._id})) return true;
		if(addr.zipCode && addr.street && addr.number){
			if(addr.box)
				if(Addresses.find({zipCode:addr.zipCode, street:addr.street, number:addr.number, box:addr.box}).count() > 0)
					return true;
			else
				if(Addresses.find({zipCode:addr.zipCode, street:addr.street, number:addr.number}).count() > 0) return true;
		}
		return false;
	},

	'isAdmin' : function(){
		var res = Meteor.users.findOne({_id:Meteor.userId()}, {"profile.isAdmin":1});
		return res ? res.profile.isAdmin : false;
	},

	'isStaff' : function(){
		console.log("staff");
		var res = Meteor.users.findOne({_id:Meteor.userId()}, {"profile.isStaff":1});
		return res ? res.profile.isStaff : false;
	},

	'getAge' : function(birthDate){
		var birthdate = new Date(birthdate);
		var cur = new Date();
		var diff = cur-birthdate; // This is the difference in milliseconds
		var age = Math.floor(diff/31536000000); // Divide by 1000*60*60*24*365
		return age;
	},

	'getCategory' : function(birthDate, family){
		var age = Meteor.call('getAge', birthDate);

		if(9 <= age && age <= 10){
			return "PreMinimes";
		}
		else if(11 <= age && age <= 12){
			return "Minimes";
		}
		else if(13 <= age && age <= 14){
			return "Cadet";
		}
		else if(15 <= age && age <= 16){
			return "Scolaire";
		}
		else if(17 <= age && age <= 19){
			return "Junior";
		}
		else if(20 <= age && age <= 40){
			return "Seniors";
		}
		else{
			return "Elites";
		}
	},
	
	/**
		@param yearDate is structured as a year.
		This is the top-level structure in the database
		One "table" year per year
		
		A year structure is as follows :
		{
			_id:<date>,
			mixt:<typeID>,
			men:<typeID>,
			women:<typeID>,
			family:<typeID>
		}
	*/
	'updateYear' : function(yearData) {
		
		if (!yearData) {
			console.error("updateYear : no yearData provided : "+yearData);
			return;
		}
		if(!yearData._id) {
			console.error("updateYear : please specify an ID (the year !).")
			return;
		}
		
		var data = {};
		
		if(yearData.mixt) {
			data.mixt = yearData.mixt;
		}
		if(yearData.men) {
			data.men = yearData.men;
		}
		if(yearData.women) {
			data.women = yearData.women;
		}
		if(yearData.family) {
			data.family = yearData.family;
		}
		
		var writeResult = Years.update({_id: yearData._id} , {$set: data}, {upsert: true});
		if(writeResult.writeConcernError){
			console.error('updateYear : ' + writeResult.writeConcernError.code + " " + writeResult.writeConcernError.errmsg);
			return;
		}

		return yearData._id;
	},
	
	/*
		@param typeData is structured as a type
		
		A type structure is as follows :
		{
			_id:<typeID>
			preminimes:<list of poolIDs>
			minimes:<list of poolIDs>
			cadets:<list of poolIDs>
			scolars:<list of poolIDs>
			juniors:<list of poolIDs>
			seniors:<list of poolIDs>
			elites:<list of poolIDs>
			
			NOTE : for the family tournament, only one list of pools :
			list:<list of poolIDs>
		}
	*/
	'updateType' : function(typeData) {
		if (!typeData) {
			console.error("updateType : no typeData provided : "+typeData);
			return;
		}
		
		var data = {};
		data.preminimes = typeData.preminimes ? typeData.preminimes : [];
		data.minimes = typeData.minimes ? typeData.minimes : [];
		data.cadets = typeData.cadets ? typeData.cadets : [];
		data.scolars = typeData.scolars ? typeData.scolars : [];
		data.juniors = typeData.juniors ? typeData.juniors : [];
		data.seniors = typeData.seniors ? typeData.seniors : [];
		data.elites = typeData.elites ? typeData.elites : [];
		data.list = typeData.list ? typeData.list : []; // family tournament case
		
		if(typeData._id) {
			var writeResult = Types.update({_id: typeData._id} , {$set: data});
			if(writeResult.writeConcernError){
				console.error('updateTypes : ' + writeResult.writeConcernError.code + " " + writeResult.writeConcernError.errmsg);
				return;
			}
			return typeData._id;
		}
		else {
			var type_id;
			Types.insert(data, function(err, typeId){
				if(err){
					console.error('updateType error while inserting');
					console.error(err);
					return;
				} 
				type_id = typeId;
			});
			// Done with new insert
			return type_id;
		}
	},

	/*
		@param courtData is structured as a court, if _id is missing, 
		a new court will be created and linked to the owner. OwnerID must be provided.
		@param address is structured as an address
		(fields can be missing, if the _id field is missing, a new address will be linked to this court, 
		erasing reference to previous addressID if existing). Can be null.

		This function does a check to prevent a user from adding a new court with an existing court address (preventing duplicates)

		A court structure is as follows :
		{
			_id:<courtId>,
			addressID:<addressID>,
			ownerID:<ownerID>,
			surface:<surface>,
			type:<type>,
			instructions:<instructions>,
			ownerComment:<ownerComment>,
			staffComment:<staffComment>,
			availability:<availability>
		}
	*/
	'updateCourt' : function(courtData, address){
		if(!courtData.ownerID){
			console.error("updateCourt : Must provide owner id to update the court !");
			return;
		}

		var u = Meteor.users.findOne({_id:courtData.ownerID});
		if(!u){
			console.error('updateCourt : owner does not exist !');
			return;
		}

		const isAdmin = Meteor.call('isAdmin');
		const isStaff = Meteor.call('isStaff');
		const userIsOwner = courtData.ownerID == Meteor.userId();

		if(! (userIsOwner || isAdmin || isStaff) ){
			console.error("updateCourt : You don't have the permissions to update a court !");
			return;
		}


       		/*TO ADD:

       		courtNumber
       		zone
       		mapNumber
       		lendThisYear (ou alors noter l'id du tournoi (ou l'année du dernier tournoi où il était prêté), sinon je ne sais pas quand on pourra le remettre à 'false' après le tournoi)      		
       		*/

		var courtId = courtData._id;
		var data = {};

		data.ownerID = courtData.ownerID;
		
		// Fill in court info
		if(courtData._id){
			data._id = courtData._id;
		}
		if(courtData.addressID){
			data.addressID = courtData.addressID;
		}
		if(courtData.surface){
			data.surface = courtData.surface;
		}
		if(courtData.courtType){
			data.courtType = courtData.courtType;
		}
		if(courtData.instructions){
			data.instructions = courtData.instructions;
		}
		if(courtData.ownerComment){
			data.ownerComment = courtData.ownerComment;
		}
		
		if((isStaff||isAdmin) && courtData.staffComment){
			data.staffComment = courtData.staffComment;
		}

		
		console.log("courtData samedi recu:" + courtData.dispoSamedi);
		console.log("courtData dim recu:" + courtData.dispoDimanche);

		if(courtData.dispoSamedi !== null && typeof courtData.dispoSamedi !== 'undefined'){
			data.dispoSamedi = courtData.dispoSamedi;
		}
		if(courtData.dispoDimanche !== null && typeof courtData.dispoSamedi !== 'undefined'){
			data.dispoDimanche = courtData.dispoDimanche;
		}

		if(typeof courtData.dispoSamedi !== 'undefined' && typeof courtData.dispoDimanche !== 'undefined')
		{
			if(courtData.dispoSamedi || courtData.dispoDimanche){
				data.lendThisYear = true;
			}
			else{
				data.lendThisYear = false;
			}
		}
		

		if(courtId){
			// Court already exists, so just update it :
			var writeResult = Courts.update({_id: courtId} , {$set: data});
			if(writeResult.writeConcernError){
				console.error('updateCourt : ' + writeResult.writeConcernError.code + " " + writeResult.writeConcernError.errmsg);
				return;
			}
			if(address){
				Meteor.call('updateAddress', address, courtData.ownerID, courtId);
			}
		}
		else{
			// Check that a court with that address does not already exist :
			if(address && Meteor.call('addressExists', address)){
				console.log("Court already exists :");
				console.log(address);
				return;
			}

			// Create a new court
			var id = Courts.insert(data, function(err, addrId){
				if(err){
					console.error('updateCourt error');
					console.error(err);
					return;
				}
				// Update addressID in the user
				courtId = addrId; // remember the court id

				if(address){
					Meteor.call('updateAddress', address, courtData.ownerID, courtId);
				}

			});
			console.log("id retourne par insert : "+id);
			return id;
		}

	},

	/*
		@param : userData : javascript object containing the fields of the user. It must include at least the _id field.
		
		User structure is as follows :
		{	
			createdAt:<createdAt>,
			_id:<id>,
			emails:[{ "address" : "<email1>", "verified" : false } , ...],
			profile:{
				name:<name>,
				title:<title>,
				firstName:<firstName>,
				lastName:<lastName>,
				addressID:<addressID>,
				phone:<phone>,
				birthDate:<birthDate>,
				AFT:<AFT>,
				isStaff:<isStaff>,
				isAdmin:<isAdmin>,
				gender:<gender>
			},
			services:{
				google{
					<google stuff>
				}
				facebook{
					<facebook stuff>
				}
			}
		}

		If the _id is not already in the DB, this will add that _id and all other fields of userData to the DB (creating a new user).
		Missing fields will not be included (except for admin and staff which default to false).
		The function will return true.
		
		If the _id is already in the DB, this will update the fields of the existing in regard of the fields in userData. 
		Missing fields will be left as they were before.
		The function will return false.
	*/
	'updateUser' : function(userData){
		if(!userData._id){
			console.error("updateUser : Must provide user id to update the user !");
			return;
		}


		const isAdmin = Meteor.call('isAdmin');
		const isStaff = Meteor.call('isStaff');
		const userIsOwner = userData._id == Meteor.userId();

		if(!(userIsOwner || isAdmin || isStaff)){
			console.error("updateUser : You don't have the required permissions!");
			return;
		}

		var profile = userData.profile;

		var data = {};
		data._id = userData._id; // Always add the id

		if(userData.createdAt){
			data.createdAt = userData.createdAt;
		}

		if(userData.services){
			data.services = userData.services;
		}

		if(userData.emails){
			data.emails = userData.emails; // Array of {address:"...@...com", verified:"true or false"}
		}

		if(profile){
			if(profile.name){
				data["profile.name"] = profile.name;
			}
			if(profile.title){
				data["profile.title"] = profile.title;
			}
			if(profile.firstName){
				data["profile.firstName"] = profile.firstName;
			}
			if(profile.lastName){
				data["profile.lastName"] = profile.lastName;
			}

			if(profile.gender){
				data["profile.gender"] = profile.gender;
			}

			if(profile.addressID){
				var a = Addresses.findOne({_id:profile.addressID});
				if(!a){
					console.error('updateUsers : addressID provided does not exist !');
					return;
				}
				data["profile.addressID"] = profile.addressID;
			}
			if(profile.phone){
				data["profile.phone"] = profile.phone;
			}
			if(profile.birthDate){
				data["profile.birthDate"] = profile.birthDate;
			}
			if(profile.AFT){
				data["profile.AFT"] = profile.AFT;
			}

			if(isAdmin && profile.isStaff){
				data["profile.isStaff"] = profile.isStaff;
			}

			if(isAdmin && profile.isAdmin){
				data["profile.isAdmin"] = profile.isAdmin;
			}
		}

		// Write data on the DB
		var writeResult = Meteor.users.update({_id: data._id} , {$setOnInsert: { 'profile.isAdmin': false, 'profile.isStaff': false }, $set: data}, {upsert: true});
		if(writeResult.writeConcernError){
			console.error('updateUser : ' + writeResult.writeConcernError.code + " " + writeResult.writeConcernError.errmsg);
			return;
		}
		if(writeResult.nUpserted >0){
			return true;
		}

		return false;
	},


	/*
		@param userId : Updates the address of the user with id userId. 
				If courtId is provided, updates the court address (userId is then the owner's id).
				userId must be provided.
		@param AddressData : if it does not contain a field _id, this will
		create a new address for the user or court (removing the reference to the previous one if there was one) and link its
		_id to the profile.addressID field of the user or the .addressID field of the court.

		The addressData structure is as follows :
		{
			_id:<id>, // Ommit this if you want to create a new address, this will be auto-generated
			street:<street>,
			number:<number>,
			box:<box>,
			city:<city>,
			zipCode:<zipCode>,
			country:<country>
		}

		If some fields are missing, they will be left untouched.
	
	*/
	'updateAddress' : function(addressData, userId, courtId){
		if(!userId && !courtId){
			console.error("updateAddress : Must provide user id or courtId to update the address !");
			return;
		}
		if(courtId && !userId){
			console.error("updateAddress : must provide the userId of the person trying to make the request if trying to modify a court!");
			return;	
		}

		var u = Meteor.users.findOne({_id:userId});
		if(!u){
			console.error('updateAddress : that user doesn\'t exist !');
			return;
		}

		if(courtId){
			// Check that that courtId really exists :
			var c = Courts.findOne({_id:courtId});
			if(!c){
				console.error('updateAddress : that court doesn\'t exist !');
				return;
			}
			// If an address id is provided, make sure that addressId is the one from the court
			if(addressData._id && c.addressID!=addressData._id){
				console.error('updateAddress : trying to update an address not belonging to the court provided!');
				return;
			}
		}
		else{
			if(addressData._id && u.profile && u.profile.addressID && u.profile.addressID != addressData._id){
				console.error('updateAddress : trying to update an address not belonging to the user provided!');
				return;
			}	
		}

		

		const isAdmin = Meteor.call('isAdmin');
		const isStaff = Meteor.call('isStaff');
		const userIsOwner = userId == Meteor.userId();
		
		if(!(userIsOwner || isAdmin || isStaff)){
			console.error("updateUser : You don't have the required permissions!");
			return;
		}

		var data = {};
		data.userID = userId;

		if(addressData.street){
			data.street = addressData.street;
		}
		if(addressData.box){
			data.box = addressData.box;
		}
		if(addressData.number){
			data.number = addressData.number;
		}
		if(addressData.city){
			data.city = addressData.city;
		}
		if(addressData.zipCode){
			data.zipCode = addressData.zipCode;
		}
		if(addressData.country){
			data.country = addressData.country;
		}

		if(!addressData._id){

			if(userId && !courtId){
				Addresses.insert(data, function(err, addrId){
					if(err){
						console.error('updateAddress error');
						console.error(err);
						return;
					} 	
					// Update addressID in the user
	        		Meteor.call('updateUser', {_id:userId, profile:{addressID:addrId}});
				});
				// Done with new insert
				return;
			}
			if(courtId){
				Addresses.insert(data, function(err, addrId){
					if(err){
						console.error('updateAddress error');
						console.error(err);
						return;
					} 	
					// Update addressID in the user
	        		Meteor.call('updateCourt', {_id:courtId, ownerID:userId, addressID:addrId});
				});
				// Done with new insert
				return;
			}
		}
		data._id = addressData._id; // set the address data


		// Add the address in the DB
		var writeResult = Addresses.update({_id: data._id} , {$set: data});
		if(writeResult.writeConcernError){
			console.error('updateAddress : ' + writeResult.writeConcernError.code + " " + writeResult.writeConcernError.errmsg);
			return;
		}
	},

	/*
		If a wish(es) is specified, it(they) must be in an array and will be appended to the list of existing wishes.
		If you supply the category (and no player), make sure it fits the category of both players --> not checked.
		The category will be automatically checked and set if you provide at least a player.
		The update fails if both players are not of the same category or if the supplied category does not fit the player.
		
		/!\ For a the family type tournament, the category should be "none"
		
		A pair is structured as follows:
		{
			_id:<id>,
			year:<year>,
			type:<type>, (mixt, men, women or family)
			category:<category>, (minimes, seniors, ...)
			player1:{
				_id:<userID>,
				extras:{
					BBQ:<bbq>
				},
				wish:<wish>,
				constraint:<constraint>,
				paymentID:<paymentID>
			}
			player2:{
				_id:<userID>,
				extras:{
					BBQ:<bbq>
				},
				wish:<wish>,
				constraint:<constraint>,
				paymentID:<paymentID>
			}
		}

		@return : the pair id if successful, otherwise returns false
	*/
	'updatePairs' : function(pairData){
		const isAdmin = Meteor.call('isAdmin');
		const isStaff = Meteor.call('isStaff');
		console.log(pairData);
		ID = {};
		if(pairData.player1){
			P1_id= pairData.player1._id;
			ID['player1'] = P1_id;
		}
		if(pairData.player2){
			P2_id = pairData.player2._id;
			ID['player2'] = P2_id;
		}

		const userIsOwner = ID['player1'] == Meteor.userId() || ID['player2'] == Meteor.userId();
		
		if(!(userIsOwner || isAdmin || isStaff)){
			console.error("updatePairs : You don't have the required permissions!");
			return false;
		}

		var data = {};
		if(pairData.year){
			data.year = pairData.year;
		}
		if(pairData.category){
			data.category = pairData.category;
		}


		if(pairData.type){
			data.type = pairData.type;
		}
			

		if(pairData._id){
			data._id = pairData._id;
		}

		// var p1_1;
		// var p1_2;
		// var p2_1;
		// var p2_2;
		// if(ID['player1']){
		// 	p1_1 = Pairs.findOne({player1:P1_id},{_id:1});
		// 	p1_2 = Pairs.findOne({player2:P1_id},{_id:1});
		// }

		// if(ID['player2']){
		// 	p2_1 = Pairs.findOne({player1:ID['player2']},{_id:1});
		// 	p2_2 = Pairs.findOne({player2:ID['player2']},{_id:1});
		// }
		// var err1 = p1_1 && p2_1 ? p1_1!=p2_1 : false;
		// var err2 = p1_1 && p2_2 ? p1_1!=p2_2 : false;
		// var err3 = p1_2 && p2_1 ? p1_2!=p2_1 : false;
		// var err4 = p1_2 && p2_2 ? p1_2!=p2_2 : false;
		// if(p1_1 && p1_2 || p2_1 && p2_1 || err1 || err2 || err3 || err4){
		// 	console.error("updatePairs : impossible configuration");
		// 	return;
		// }

		// if(p1_1){
		// 	pairData['_id'] = p1_1;	
		// }
		// else if(p1_2){
		// 	pairData['_id'] = p1_2;	
		// }
		// else if(p2_1){
		// 	pairData['_id'] = p2_1;	
		// }
		// else if(p2_2){
		// 	pairData['_id'] = p2_2;	
		// }


		// Player = player1 or player2
		setPlayerData = function(player){
			if(!pairData[player]) return; // Don't return false
			
			var p ={};

			var u = Meteor.users.findOne({_id:ID[player]});
			if(!u){
				console.error('updatePairs : player doesn\'t exist !');
				return false;
			}
			
			/*
				Set or verify the category
			*/
			if(u.profile.birthDate){
				cat = Meteor.call('getCategory', u.profile.birthDate);
				if(!data.category){
					// Set the category to that of the player
					data['category'] = cat;
				}
				else if(data.category != cat){
					console.error("The category doesn't correspond to the player's age !");
					return false;
				}
			}



			p['_id'] = ID[player];
			pData = pairData[player];
			
			if(pData['paymentID']) p['paymentID'] = pData['paymentID'];
			if(pData['wish']) p['wish'] = pData['wish'];
			if(pData['constraint']) p['constraint'] = pData['constraint'];
			if(pData['extras']){
				extr = {};
				var count = 0;
				var dataExtras = pData['extras'];
				if(dataExtras['BBQ']){
					extr['BBQ'] = dataExtras['BBQ'];
					count = count+1;
				}
				if(count>0){
					p['extras'] = extr;
				}
			} 
			data[player] = p;
		}

		if(setPlayerData("player1") == false) return false;
		if(setPlayerData("player2") == false) return false;
		


		console.log(data);

		if(!pairData._id){
			var id;
			Pairs.insert(data, function(err, pairId){
				if(err){
					console.error('updatePairs error');
					console.error(err);
					return false;
				}
				id = pairId;
			});
			// Done with new insert
			return id;
		}

		// Add the address in the DB
		var writeResult = Pairs.update({_id: pairData['_id']} , {$set: data});
		if(writeResult.writeConcernError){
			console.error('updatePairs : ' + writeResult.writeConcernError.code + " " + writeResult.writeConcernError.errmsg);
			return false;
		}
		return pairData._id;
	},


	/*
		A payment is structured as follows :
		{
			_id:<id>,
			status:<status>, // paid or pending
			balance:<balance>,
			date:<data>,
			method:<method>, // Cash, Visa or Banknumber
		}

		player : can either be player1 or player2
	*/
	'updatePayment' : function(paymentData, pairId, player){
		if(!pairId){
			console.error('updatePayment : you must provide the pairId');
			return;
		}
		if(player!="player1" || player!="player2"){
			console.error('updatePayment : player is not recognized');
			return;
		}

		// Check that that pair really exists :
		var p = Pairs.findOne({_id:pairId});
		if(!p){
			console.error('updatePayment : that pair doesn\'t exist !');
			return;
		}

		const isAdmin = Meteor.call('isAdmin');
		const isStaff = Meteor.call('isStaff');
		
		if(!(isAdmin || isStaff)){
			console.error("updatePairs : You don't have the required permissions!");
			return;
		}

		var data = {};
		if(paymentData._id){
			var str = "paymentID.";
			var str2 = str.concat(player);
			if(p[str.concat(player)] && paymentData._id != p[str2]){
				console.error('updatePayment : trying to update a payment not belonging to the pair provided !');
				return;
			}
			data._id = paymentData._id;
		}
		if(paymentData.status){
			data.status = paymentData.status;
		}
		if(paymentData.balance){
			data.payment = paymentData.balance;
		}
		if(paymentData.date){
			data.date = paymentData.date;
		}
		if(paymentData.method){
			data.method = paymentData.method;
		}

		if(!paymentData._id){
			Payments.insert(data, function(err, paymId){
				if(err){
					console.error('updatePayment error');
					console.error(err);
					return;
				} 	
				var str = "paymentID.";
				var str2 = str.concat(player);
				// Update paymentID in the pair
				var upd = {};
				upd["_id"] = pairId;
				upd[str2] = paymId;
        		Meteor.call('updatePair', upd);
			});
			// Done with new insert
			return;
		}

		var writeResult = Payments.update({_id: paymentData._id} , {$set: data});
		if(writeResult.writeConcernError){
			console.error('updatePayment : ' + writeResult.writeConcernError.code + " " + writeResult.writeConcernError.errmsg);
			return;
		}
	},


	/*
		If no _id is provided, creates a new match. Else, updates it.

		A match is structured as follows :
		{
			_id:<id>
			pair1:<pairID>,
			pair2:<pairID>,
			result:{
					pair1Points:<points>, 
					pair2Points:<points>
					},
			court:<courtID>
		}

		@return the _id of the match

	*/
	'updateMatch' : function(matchData){
		data = {};

		if(matchData.pair1){
			data.pair1 = matchData.pair1;
		}
		if(matchData.pair2){
			data.pair2 = matchData.pair2;
		}
		if(matchData.result){
			var count = 0;
			var res = {};
			if(matchData.result.pair1Points){
				res['pair1Points'] = matchData.result.pair1Points;
				count = count+1;
			}
			if(matchData.result.pair2Points){
				res['pair2Points'] = matchData.result.pair2Points;
				count = count+1;
			}
			if(count>0){
				data['result'] = res;
			}
		}
		if(matchData.court){
			data.court = matchData.court;
		}


		if(!matchData._id){
			var match_id;
			Matches.insert(data, function(err, matchId){
				if(err){
					console.error('updateMatch error');
					console.error(err);
					return;
				} 
				match_id = matchId;
			});
			// Done with new insert
			return match_id;
		}

		var writeResult = Matches.update({_id: matchData._id} , {$set: data});
		if(writeResult.writeConcernError){
			console.error('updateMatch : ' + writeResult.writeConcernError.code + " " + writeResult.writeConcernError.errmsg);
			return;
		}

		return matchData._id;
	},

	/*
		A pool is structured as follows:
		{
			_id:<id>,
			court:<court>,
			pairs:[<pairID>, <pairID>, ...], // Will append pairs to existing array (no duplicates possible)
			leader:<userId>,
			matches:[<matchID>, ...], // Will append matches to existing array (no duplicates possible)
			court:<courtID>,
			winners:[<pairID>, ...] // Will append winners to existing array (no duplicates possible)
		}

		@return the pool id
	*/
	'updatePool' : function(poolData){
		var data = {$set:{}, $addToSet:{}};

		if(poolData.court){
			data["$set.court"] = poolData.court;
		}
		if(poolData.leader){
			data["$set.leader"] = poolData.leader;
		}
		
		if(poolData.pairs){
			data["$addToSet.pairs"] = poolData.pairs;
		}
		if(poolData.matches){
			data["$addToSet.matches"] = poolData.matches;
		}
		if(poolData.winners){
			data["$addToSet.winners"] = poolData.winners;
		}

		if(!poolData._id){
			var pool_id;
			Pools.insert(data, function(err, matchId){
				if(err){
					console.error('updatePool error');
					console.error(err);
					return;
				} 
				pool_id = poolId;
			});
			// Done with new insert
			return pool_id;
		}

		var writeResult = Pools.update({_id: poolData._id} , data);
		if(writeResult.writeConcernError){
			console.error('updatePool : ' + writeResult.writeConcernError.code + " " + writeResult.writeConcernError.errmsg);
			return;
		}
		return poolData._id;

	},
	
	/*
		@param pairID a valid ID for a pair that is the Pairs table
	
		Adds the pair in the tournament on the right pool.
	 */
	'addPairsToTournament' : function(pairID) {
		if(!pairID) {
			console.error("Error addPairsToTournament : no pairID specified");
			return undefined;
		}
		var pair = Pairs.findOne({_id:pairID});
		var poolID = Meteor.call('getPoolToFill', pair.year, pair.type, pair.category);
		var pool = Pools.findOne({_id:poolID});
		var pairs = pool.pairs;
		
		pairs.push(pairID);
		data = {};
		data._id = poolID;
		data.pairs = pairs;
		Meteor.call('updatePool', data);
	},
	
	/*
		@param year is the year of the tournament to consider
		@param type is the type of the tournament to consider (men, mixt, women or family)
		@param category is the age category of the tournament : preminimes, minimes, cadets, scholars, juniors, seniors or elites
		
		Returns the ID of the current pool to fill.
		The pools are filled one by one directly after a player has registered.
		If the upper-level table does not exist (year or type), creates an empty one then adds the pair.
	*/
	'getPoolToFill' : function(year, type, category) {
		if(!year || !type || !category) {
			console.error("Error GetPoolToFill : no year and/or type and/or category specified");
			return undefined;
		}
		
		var yearTable = Years.findOne({_id:year});
		if (!yearTable) {
			console.log("getPoolToFill : no Year table found for year "+year+". Creating an empty one.");
			yearTable = Meteor.call('updateYear', {_id:year});
		}
		
		var typeID;
		switch(type) {
			case "mixt": typeID = yearTable.mixt;
			break;
			case "men": typeID = yearTable.men;
			break;
			case "women": typeID = yearTable.women;
			break;
			case "family": typeID = yearTable.family;
			break;
			default: console.error("Error GetPoolToFill : the type specified");
			console.error("Type specified : "+type);
			return undefined;
		}
		
		var typeTable = Types.findOne({_id:typeID});
		
		// No type table for now
		if (!typeTable) {
			console.log("getPoolToFill : no Type table found for year "+year+" and type "+type+". Creating an empty one.");
			typeID = Meteor.call('updateType', {});
			typeTable = Types.findOne({_id:typeID});
		}
		
		return Meteor.call('getNextPoolInPoolList', typeTable, category);
	},
	
	/*
		@param typeTable an object stored in the table Types
		@param category : minimes, seniors,...
		
		Helper of the *getPoolToFill* function
		Returns the current pool on which a pair should be registered
		This pool should be the first 'not full' pool it encounters while iterating over the list of pools
		If all current pools are full, create a new pool, update the Types table and returns the poolID
	*/
	'getNextPoolInPoolList' : function(typeTable, category) {
		
		var poolList = Meteor.call('getPoolIDList', typeTable._id, category);
		var i = 0;
		var poolID = poolList[i];
		
		while(poolID) {
			pool = Pools.findOne({_id:poolID});
			if (!pool) {
				console.error("getNextPoolInPollList : Error, no pool with ID "+poolID+" found in Pools table");
				return undefined;
			}
			// Pool not full
			var maxNbrPairsInPool = 6;
			if (! (pool.pairs.length > maxNbrPairsInPool)) {
				return poolID;
			}
			i++;
			poolID = poolList[i];
		}
		
		// no 'not full' pool found, creating a new one
		
		poolID = Meteor.call('updatePool', {});
		poolList.push(poolID);
		data = {};
		data._id = typeID;
		
		switch(category) {
			case "preminimes": data.preminimes = poolList;
			break;
			case "minimes": data.minimes = poolList;
			break;
			case "cadets": data.cadets = poolList;
			break;
			case "scolars": data.scolars = poolList;
			break;
			case "juniors": data.juniors = poolList;
			break;
			case "seniors": data.seniors = poolList;
			break;
			case "elites": data.elites = poolList;
			break;
			case "none": data.list = poolList;
			break;
			default: console.error("category not defined : "+category);
			return undefined;
		}
		
		// Update the type table concerned with the new pool
		Meteor.call('updateType', data);
		
		return poolID;
	},
	
	/*
		@param typeTable a typeTable in the Types table
		@param category : minimes, seniors, ...
	
		Helper of the *getNextPoolInPoolList* function
		returns the ID of the pool list corresponding to the category specified in the type table specified by typeID
	*/
	'getPoolIDList' : function(typeTable, category) {
		switch(category) {
			case "preminimes": return typeTable.preminimes;
			break;
			case "minimes": return typeTable.minimes;
			break;
			case "cadets": return typeTable.cadets;
			break;
			case "scolars": return typeTable.scolars;
			break;
			case "juniors": return typeTable.juniors;
			break;
			case "seniors": return typeTable.seniors;
			break;
			case "elites": return typeTable.elites;
			break;
			case "none": return typeTable.list;
			break;
			default: console.error("Error getPoolIDList : category "+category+" is not recognized.");
			return undefined;
		}
	},
	
	/*
		Returns the list of the IDs of all the pools in the DB
	 */
	'getPools' : function() {
		var list = []
		Pools.find().forEach(function(data){
			list.push(data._id);
		})
	},

	'removePair' : function(pairId){
		Pairs.remove({_id:pairId});
	},

	'insertQuestion' : function(Question){
		var data ={
			lastname : Question.lastname,
			firstname: Question.firstname,
			email : Question.email,
			question : Question.question,
			date : Question.date,
			processed : false
		}
		return Questions.insert(data)
	}
	
	
});