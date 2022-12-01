
 $(document).ready(function () {
	$( ".togglePlus" ).click(function() {
		var nextNext = this.nextElementSibling.nextElementSibling;
		if(nextNext.classList.contains('show')){
		   this.nextElementSibling.classList.remove('open');
		   this.nextElementSibling.nextElementSibling.classList.remove('show');
		   $(this).html('+'); 

		}
		else{
			this.nextElementSibling.classList.add('open');
		   this.nextElementSibling.nextElementSibling.classList.add('show');
		    $(this).html('-'); 

		}
		
			   
	});



   var subnavLink = document.querySelectorAll('.subnav li a'),
        subnavButton = document.querySelectorAll('a.subnav-button');
  
  
  
    function handleSubNavLink(link){
        // link is clicked
        if(link){
            if(link.getAttribute("href")){
                window.location = link.getAttribute("href");
            }else{
               var nextUl = link.nextElementSibling;
               if(nextUl.classList.contains('show')){
                   link.classList.remove('open');
                   link.nextElementSibling.classList.remove('show');
               }else{
                   link.classList.add('open');
                   link.nextElementSibling.classList.add('show');

               }
            }
        }else{
            // load document check active link
            for(var i=0;i<subnavLink.length;i++) {
                if(subnavLink[i].getAttribute("href") !== "" && subnavLink[i].href === location.href){
                    subnavLink[i].classList.add('active');
                    activateParentUl(subnavLink[i]);
                    activateChildUl(subnavLink[i]);
					$('.subnav-navigation').removeClass('show');
                }
            }
        }

        /**
         * activateParentUl
         * @param link
         */
        function activateParentUl(link){

            var parentUl = link.parentNode.parentNode;

            if(parentUl.tagName.toLowerCase() == 'ul'){
                parentUl.classList.add('show');
                activateParentUl(parentUl);
            }
        }


        /**
         * activateChildUl
         * @param link
         */
        function activateChildUl(link){

            var childUl = link.nextElementSibling;

            if(childUl && childUl.tagName.toLowerCase() == 'ul'){
                childUl.classList.add('show');
                activateChildUl(childUl);
            }
        }
    }

    /**
     * addEventListeners
     */
    function addEventListeners() {
        var toggleButton = document.querySelector('a.toggle');

		 toggleButton.addEventListener("click", function(event){
            event.preventDefault();
            toggleImage();
			$('.icon-menu').toggleClass('icon-menu-rotate');
        });

        // subnav link
        for(var i=0;i<subnavLink.length;i++) {
            subnavLink[i].addEventListener("click", function(event){
                event.preventDefault();
                handleSubNavLink(this);
            });
        }

        // toggle menu
        for(var i=0;i<subnavButton.length;i++) {
            subnavButton[i].addEventListener("click", function(event){
                event.preventDefault();
                toggleMenu(this);
            });
        }

        handleSubNavLink();
    }

    /**
     * toggleMenu
     * @param button
     */
    function toggleMenu(button) {

        var subnavNavigation = document.querySelector('.subnav-navigation'),
            subnavMap = document.querySelector('.subnav-map');

        if(subnavNavigation.classList.contains('hide')){
            subnavNavigation.classList.remove('hide');
            subnavMap.classList.add('hide');

        }else{
            subnavMap.classList.remove('hide');
            subnavNavigation.classList.add('hide');
        }

        for(var i=0;i<subnavButton.length;i++) {
            subnavButton[i].classList.remove('active');
        }

        button.classList.add('active');

    }
	function toggleImage(){
        var menuContainer = document.querySelector('.menu-container'),
            imageContainer = document.querySelector('.image-container'),
            subnav = document.querySelector('.subnav');

        if(menuContainer.classList.contains('menu-container--expanded')){
            menuContainer.classList.remove('menu-container--expanded');
            imageContainer.classList.remove('image-container--expanded');
            subnav.classList.remove('hide');

        }else{
            menuContainer.classList.add('menu-container--expanded');
            imageContainer.classList.add('image-container--expanded');
            subnav.classList.add('hide');
        }
    }
	
	addEventListeners();
  
});