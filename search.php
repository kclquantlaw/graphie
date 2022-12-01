<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <meta charset="utf-8">
  <link rel="stylesheet" type="text/css" href="foundation.css" />
  <link rel="stylesheet" type="text/css" href="app.css" />
  <link rel="stylesheet" type="text/css" href="d3-context-menu.css" />
    <link rel="stylesheet" type="text/css" href="select2.min.css"/>

  <!-- Bootstrap CSS -->
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
  <script src="https://kit.fontawesome.com/842fbf18d4.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="manor.css" />
  <link rel="stylesheet" href="styles/main.css" />
  
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
  <title>Hello Graphie</title>
  
</head>
<body>

 <nav class="navbar navbar-expand-lg sticky-top navbar-dark bg-dark">
      <a class="navbar-brand" href="#">Graphie</a>
    
      <div class="collapse navbar-collapse" id="myNavbar">
        <ul class="navbar-nav mr-auto mt-2 mt-lg-0">
          <li class="nav-item">
            <a class="nav-link" href="#!"> One Page View</a>
          </li>
		  <li class="nav-item">
		  			<a class="nav-link" href="#!"> Tree View</a>
          </li>

        </ul>
		
      </div>
<!--                <div id="searchName"></div> -->
				
		<form action="javascript:void(0);"  class="form-inline my-2 my-lg-0">
          <input id="searchItem" name="searchItem" class="form-control mr-sm-2" text='Under Development' type="search" placeholder="Search" aria-label="Search">
          <button  id="searchBox" class="btn btn-outline-primary my-2 my-sm-0" type="submit">Search</button>
        </form>

    </nav>
	
       
        <div id="tree-container"></div>

        <script type="text/javascript" src="d3.v3.min.js"></script>
        <script type="text/javascript" src="dndTree.js"></script>
        <script type="text/javascript" src="jquery.js"></script>
        <script type="text/javascript" src="foundation.min.js"></script>
        <script type="text/javascript" src="select2.min.js"></script>
        <script>
                // for the first initialization
                $('document').ready(function(){
                    $(document).foundation();
                    $(document).on('opened', '[data-reveal]', function () {
                        var element = $(".inputName:visible").first();
                        element.focus(function(){
                            this.selectionStart = this.selectionEnd = this.value.length;
                        });
                        element.focus();
                    });
                 
					
					$("#searchBox").click(function(e) {
                      //  clearAll(tree_root);
                        expandAll(tree_root);
                        outer_update(tree_root);

                        searchField = "d.name";
						
						<?php 
							if(isset($_GET['searchItem'])){
						?>
                             searchText = "<?php echo $_GET['searchItem']?>"
						
						<?php 
						}else{
						?>
                             searchText = $("#searchItem").val();
						<?php 
							}
						?>

                        firstCall = true;
                        searchTree(tree_root, firstCall);
                        tree_root.children.forEach(collapseAllNotFound);
                        outer_update(tree_root);
                        tree_root.children.forEach(centerSearchTarget);
                    })
					
					<?php 
							if(isset($_GET['searchItem'])){
						?>
						
					$("#searchBox").click();
					
					<?php 
							}
						?>

                    var treeJSON = d3.json("tree.json", draw_tree);
                });
        </script>
        <script>
          $(document).foundation();
        </script>
</body>
</html>

