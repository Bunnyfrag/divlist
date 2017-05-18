/*  /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
	|---searpagort--By Bunnyfrag-(Blame the trainee)---|
	|--------------------------------------------------|
	\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/

	Special thanks to Steve for the help
*/
	class SPO {

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
