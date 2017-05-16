/*  /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
	|-----DivList--By Bunnyfrag-(Blame the trainee)----|
	|--------------------------------------------------|
	\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/

	REQUIRE:
			-Bootstrap css ?	http://getbootstrap.com

	DivList is a simple class that let you create paginated and sortable lists from anything you can toss in a div*.
		Create a new DivList with :
			<name of the instance> = new DivList('ListId',Lpp,'PageNbId');
		where 'ListId' is the id of the element that contains the elements you want to turn into a list,
			  lpp is the default number of lines per pages,
			  'PageNbId' is the id of an element that will contain the number of the current page;
		Only the first argument is required.
		You will need to store the object somewhere to interact with the list, as it also contains the commands to do so.

		*Maybe.
			Please read below for more infos.


	DivList requires specific components in order to work:
		- an element identified by an id that contains the elements forming the list. You need to pass said id as the first argument of the constructor.
			note that each of those elements will be considered as the lines and their childrens as the 'rows'.
			example:	<div class='container' id='DivList-list'></div>

	Optional:
		- an element with an onclick event set to <instance>.sort(event) containing a bunch of other elements with data-sort set to either :
			1:	a string corresponding to an entry in the dataset array of each lines (see below) or
			2:	anything else for alpha sorting
		This is great to make some sort of 'header'
		You can generate it with the .genSorters() method and then append it: pass the id of the header container as the first argument, then specify the css classes for the header and the label of the rows
			example:	divlist.genSorters('sortbar','col-md-12 theHeaderOne','sorter col-md-2','This','is','the','header','Date','random numbers');
		Or you can do it yourself if you don't like the generated layout
			example:	<div class='col-xs-12' id='theHeaderOne' onclick="<instance>.sort(event)">
							<div class='col-xs-2'><label data-sort='id'>1st row</label></div>
							<div class='col-xs-2'><label data-sort=''>2nd row</label></div>
							<div class='col-xs-2'><label data-sort=''>3rd row</label></div>
							<div class='col-xs-2'><label data-sort=''>4th row</label></div>
							<div class='col-xs-2'><label data-sort='stamp'>Date</label></div>
						</div>
		alternatively, you can call the <instance>.sort() function and:
			- Directly type in the number of the row you want to sort by
			- Directly type in the name of the dataset entry you want to sort by
			- add a second argument to sort by a specific order ('asc' for ascending, anything else for descending)

				example:	<instance>.sort(0,'asc')		//will alpha sort using the first row and display the result in an ascending order
							<instance>.sort('time','desc')	//will sort using the data-time attribute of each lines and display the result in a descending order

		- If you want to be able to sort lines per dataset you need to set their values
			example:	<div class='col-xs-12'  data-stamp='1507327200'></div>	<!-- This would be useful for sorting per dates-->
		- if you don't want to you'll have to modify the .sort() method default sorting command

		-You can create additional controls by calling <instance>.page() . Specify a page number or use 'L' to get to the last page. Call .page() to get to the first page;
		specify '+' or '-' to go forward or backward. add a second argument to move through a given amount of pages.

			example:  <instance>.page(7)	will make you go to page 7 if available (or the last page if not)
								.page('L')	will make you go to the last page
								.page('+')  will make you go 1 page forward
								.page('-',5)will make you go 5 pages backward

		-You can create an input field to query the list:
			example:	<input type=text id='searchBar' onkeyup='<instance>.search(this.value)'></input>

		-You can create an element identified by an id to keep track of the page number. You need to pass said id as the third argument of the constructor.
		if it is a number typed input field you can call .page() with an event like you would with any other controls to let the user directly type in the page number;
			example:	<input type=number id='DivList-pageNb' onchange='divlist.page(this.value)'></input>

		-You can add a control to change the amount of lines per pages by calling .setLpp() .
			example:		<select id='lppChooser' onchange='divlist.setLpp(this)'><option value="3" selected>3</option>...</select>
		To set the default amount of lines per pages pass it as the second argument of the constructor.

	Upon initialising the page, the entire list may quickly pop up before the page finish loading. In order to avoid that hide the list temporarily and show it when you are done setting things up.
			example:
			window.onload = function() {
				divlist = new DivList('DivList-list',5,'DivList-pageNb');
				document.getElementById('DivList-list').style.display = 'block';		// Avoid popping effect
			};

	Special thanks to Steve for the help
*/
	class DivList {

		constructor(ListId,Lpp,PageNbId)
		{
			this.searching		= false;
			this.found			= [];									// This is where we store the searching queries answers

			if( typeof ListId 		=== 'undefined')	{ throw new Error('First argument required'); }		else{ this.listId = ListId; }	// This id must refer to the object containing all the divs
			if( typeof PageNbId 	!== 'undefined')	{ this.pageNbId = PageNbId; }														// This input's value will always be equal to the page number displayed.
			if( typeof Lpp 			=== 'undefined')	{ this.lpp = 10 }									else{ this.lpp = Lpp; }			// Stands for lines per pages

			this.list			= [];												// This is where we hide all of your divs :)
			for( var el=0; el < document.getElementById(this.listId).children.length; el++){
				this.list.push(document.getElementById(this.listId).children[el]);	// And this is how we get them in here.
			}

			this.sortOrder		= 'asc';								// Used to keep track of the sorting order. Changing it to anything but 'asc' would invert the starting order
			this.arrow 			= document.createElement("span");					// Span used to display the arrow. Uses Bootstrap classes. Feel free to replace those in the .sort() method
			this.arrow.setAttribute('aria-hidden',"true");
			this.arrow.className= "glyphicon glyphicon-chevron-down";
			this.sort();															// Default sorting. It also call page() so it doesn't display everything at once
		}

		search(tf)
		{

			this.found	= [];

				if( typeof tf === 'undefined' || tf.length == 0){
					this.searching = false;
					this.page(1);
				return;
				}
				else{ this.searching = true; }

			var i		 	= 0;
			var currentObject	= this;											// The value of 'This' is changing through .each() but we still need a reference to the current object
				this.list.forEach( function(el)
				{

					var str = el.textContent;
					if (str.toLowerCase().indexOf( tf.toLowerCase() ) >= 0){
						currentObject.found.push(el);
					}
				i++;
				});
				this.page();
		}

		sort(ev,order)
		{
			var childPos	= 0;

			switch(typeof ev){
				case 'undefined':
					this.sort(0);												// This is the default sort command. You could change it but it's one of the safest options
				return;

				case 'object':
					var target		= ev.target;
					if( target == (this.arrow) )
					{
						target		= target.parentNode;
						var switchOrder = true;
					}
					var argnb		= target.dataset.sort;
					if( typeof argnb === 'undefined')	{ return; }
					childPos = [].indexOf.call(target.parentNode.children, target);
					target.appendChild(this.arrow);
				break;

				case 'string':
					argnb		= ev;
					//childpos = 0

				case 'number':
					childPos	= ev;
					//argnb is undefined

				default:
					if(this.arrow.parentNode !== null){						// If appended to something, remove it
						this.arrow.parentNode.removeChild(this.arrow);
					}
					if (typeof order !== 'undefined' && order != this.sortOrder){
						var switchOrder = true;									// Inverting so the arrow will still point out the correct way when using the sorters
						if (order=='asc'){ order = 'desc'; }
					}
			}


			if(switchOrder)
			{
				this.arrow.className = "glyphicon glyphicon-chevron-";			// Here is the css class for the bootstrap glyphicon, minus the 'up' or 'down' prefix
				if( this.sortOrder == 'asc' ){
					this.sortOrder = 'desc';
					this.arrow.className+='up';
				}else{
					this.sortOrder = 'asc';
					this.arrow.className+='down';
				}

			}


			var currentObject = this;
			this.list.sort( function (a, b) {
				var x = 0,y = 0;
				var multi= -1;

				if( typeof argnb !== 'undefined' && ( typeof a.dataset[ argnb ] !== 'undefined' || typeof b.dataset[ argnb ] !== 'undefined' ) ){		// Can we sort using the specified dataset ?
					// x = a.dataset[ argnb ]; x = (typeof x !== "undefined") ? x : 0;
					// y = b.dataset[ argnb ]; y = (typeof y !== "undefined") ? y : 0;
					x = a.dataset[ argnb ] || 0;
					y = b.dataset[ argnb ] || 0;
				}else{															// If not, sort by text value of the corresponding row
					x = a.children[childPos].textContent.toLowerCase();
					y = b.children[childPos].textContent.toLowerCase();
				}

				if( currentObject.sortOrder == 'asc' )	{ multi = 1; }

				if( !isNaN(x) && !isNaN(y) ){
					return parseInt( x )*multi - parseInt( y )*multi;
				}else{
					if ( multi == 1 ){
						return x.localeCompare(y);
					}else{
						return y.localeCompare(x);
					}
				}

			});
			this.page();
		}

		lastPage(pageNumber)							// Could be useful to display it somewhere. also used in page()
		{

			var arraySize;
					if( this.searching == true){
						arraySize = this.found.length;
					}else{
						arraySize = this.list.length;
					}
			var max = Math.ceil( arraySize / this.lpp );
			if ( max == 0 ){ max++ };
			return max;
		}

		currentPage()									// This function is useful to keep track of the page number. It is redefined each time the .page() method is called
		{
			return 1;
		}

		page()
		{
			var pageNumber;
			switch (typeof arguments[0]){
			case 'undefined':
				pageNumber		= 1;
				break;
			case 'string':
				if(typeof arguments[1] === 'number'){ var arg2 = true }

				switch (arguments[0]){
					case 'L' :	pageNumber = this.lastPage();
						break;
					case '+' :	if(arg2) pageNumber = this.currentPage() + arguments[1]; else pageNumber = this.currentPage() +1;
						break;
					case '-' :	if(arg2) pageNumber = this.currentPage() - arguments[1]; else pageNumber = this.currentPage() -1;
						break;
					default: throw  new Error('First argument must be either a number or one of these character: "L","+","-"');
				}

				break;
			case 'number':
				pageNumber	= arguments[0];
			}
			if( pageNumber < 1 ){ pageNumber	= 1; }
			else{
				if ( pageNumber > this.lastPage() )	{ pageNumber = this.lastPage(); }
			}
			if( typeof this.pageNbId !== 'undefined')	{
				 if (document.getElementById(this.pageNbId).tagName.toLowerCase() == 'input'){
					document.getElementById(this.pageNbId).value			= pageNumber;
				 }else{
					document.getElementById(this.pageNbId).innerHTML	= 'Page ' + pageNumber + ' of ' + this.lastPage();
				}
			}

			var s	=	this.lpp*( pageNumber - 1 );
			var f	=	this.lpp * pageNumber;

			document.getElementById(this.listId).innerHTML	=	'';

			if( this.searching == true){
				for(var i = s ; i <= f-1 ; i++){
					if(typeof this.found[i] !== "undefined"){					//in case the amount of elements to display is superior to the number of elements found
						document.getElementById(this.listId).appendChild(this.found[i]);
					}else{ return; }
				}

			}else{
				for(var i = s ; i <= f-1 ; i++){
					if(typeof this.list[i] !== "undefined"){					//in case the amount of elements to display is superior to the number of maximum elements
					document.getElementById(this.listId).appendChild(this.list[i]);
					}else{ return; }
				}
			}

			this.currentPage=function()											// Redefine the method so it always return the correct page number
			{
				return pageNumber;
			}

		}

		setLpp(input)
		{
			this.lpp = input.value;
			this.page();
		}

		clear()
		{
			this.list = [];
			this.found= [];
			this.page();			//document.getElementById(this.listId).innerHTML	=	'';
		}

		repopulate()
		{
			for( var el=0; el < document.getElementById(this.listId).children.length; el++){
				this.list.push(document.getElementById(this.listId).children[el]);
			}
			this.page();
		}

		//Tools
		genSorters(containerID,headerClass,labelClass)
		{
			var header 		= document.createElement("nav");
			header.onclick  = this.sort.bind(this);
			header.className= headerClass;
			for(var i = 3 ; i < arguments.length ; i++){
				var btn 		= document.createElement("label");
				if(typeof this.list[0].dataset[ arguments[i].toLowerCase() ] !== 'undefined' ){		// Detection of the datasets require that at least the first line has every datasets
					btn.dataset.sort = arguments[i].toLowerCase();
				}else{
					if(arguments[i]!=""){ btn.dataset.sort = 'alpha' };
				}
				btn.className	= labelClass;
				btn.innerHTML	= arguments[i];
				header.append(btn);
			}
			document.getElementById(containerID).append(header);
			return header;
		}
	}
