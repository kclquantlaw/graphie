function close_modal() {
    $(document).foundation('reveal', 'close');
}

var tree_root;
outer_update = null;
outer_centerNode = null;
var nodeTextOffset = 15;


function select2DataCollectName(d) {
    if (d.children)
        d.children.forEach(select2DataCollectName);
    else if (d._children)
        d._children.forEach(select2DataCollectName);
    select2Data.push(d.name);
}

function searchTree(d, first_call=false) {
    if (d.children)
        d.children.forEach(searchTree);
    else if (d._children)
        d._children.forEach(searchTree);
    var searchFieldValue = eval(searchField);

    if (searchFieldValue && (searchFieldValue.indexOf(searchText)!=-1)) {
        if (first_call) {
            d.search_target = true;
        } else {
            d.search_target = false;
        }
        // Walk parent chain
        var ancestors = [];
        var parent = d;
        while (typeof(parent) !== "undefined") {
            ancestors.push(parent);
            parent.class = "found";
            parent = parent.parent;
        }
        //console.log(ancestors);
    }
}

 function clearAll(d) {
    d.class = "";
    if (d.children)
        d.children.forEach(clearAll);
    else if (d._children)
        d._children.forEach(clearAll);
 }

function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

function collapseAllNotFound(d) {
    if (d.children) {
        if (d.class !== "found") {
            d._children = d.children;
            d._children.forEach(collapseAllNotFound);
            d.children = null;
        }
        else {
             d.children.forEach(collapseAllNotFound);
        }
    }
}

function centerSearchTarget(d) {
    if (d.search_target) {
        outer_centerNode(d);
        console.log("Found search target: " + d.name);
    }
    if (d.children) {
        d.children.forEach(centerSearchTarget);
    }
}

function expandAll(d) {
    if (d._children) {
        d.children = d._children;
        d.children.forEach(expandAll);
        d._children = null;
    } else if (d.children)
        d.children.forEach(expandAll);
}

function nodeToolTip(d) {
    html = '<a href="' + d.directory_url + '">' + d.display_name + '</a>';
    lines = 1;
    if (d.job_title) {
        html += '<br/>' + d.job_title
        lines += 1;
    }
    if (d.department) {
        html += '<br/>' + d.department
        lines += 1;
    }
    return { 'html': html,
        'lines': lines }
}

function draw_tree(error, treeData) {

    // Calculate total nodes, max label length
    var totalNodes = 0;
    var maxLabelLength = 0;
    // panning variables
    var panSpeed = 200;
    var panBoundary = 20; // Within 20px from edges will pan when dragging.
    // Misc. variables
    var i = 0;
    var duration = 750;
    var root;

    // size of the diagram
    var viewerWidth = $(document).width();
    var viewerHeight = $(document).height();

    var tree = d3.layout.tree()
        .size([viewerHeight, viewerWidth]);

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    // A recursive helper function for performing some setup by walking through all nodes

    function visit(parent, visitFn, childrenFn) {
        if (!parent) return;

        visitFn(parent);

        var children = childrenFn(parent);
        if (children) {
            var count = children.length;
            for (var i = 0; i < count; i++) {
                visit(children[i], visitFn, childrenFn);
            }
        }
    }

    // Call visit function to establish maxLabelLength
    visit(treeData, function(d) {
        totalNodes++;
        maxLabelLength = Math.max(d.name.length, maxLabelLength);

    }, function(d) {
        return d.children && d.children.length > 0 ? d.children : null;
    });

    function delete_node(node) {
        visit(treeData, function(d) {
                if (d.children) {
                    for (var child of d.children) {
                        if (child == node) {
                            d.children = _.without(d.children, child);
                            update(root);
                            break;
                        }
                    }
                }
            },
            function(d) {
                return d.children && d.children.length > 0 ? d.children : null;
            });
    }


    // sort the tree according to the node names

    function sortTree() {
        tree.sort(function(a, b) {
            return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
        });
    }
    // Sort the tree initially incase the JSON isn't in a sorted order.
    sortTree();

    // TODO: Pan function, can be better implemented.

    function pan(domNode, direction) {
        var speed = panSpeed;
        if (panTimer) {
            clearTimeout(panTimer);
            translateCoords = d3.transform(svgGroup.attr("transform"));
            if (direction == 'left' || direction == 'right') {
                translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                translateY = translateCoords.translate[1];
            } else if (direction == 'up' || direction == 'down') {
                translateX = translateCoords.translate[0];
                translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
            }
            scaleX = translateCoords.scale[0];
            scaleY = translateCoords.scale[1];
            scale = zoomListener.scale();
            svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
            d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
            zoomListener.scale(zoomListener.scale());
            zoomListener.translate([translateX, translateY]);
            panTimer = setTimeout(function() {
                pan(domNode, speed, direction);
            }, 50);
        }
    }

    // Define the zoom function for the zoomable tree

    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }


    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    var div = d3.select("#tree-container").append("div")
        .attr("class", "node_tooltip")
        .style("opacity", 0);

    // define the baseSvg, attaching a class for styling and the zoomListener
    var baseSvg = d3.select("#tree-container").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight);

    baseSvg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "white")

    baseSvg.call(zoomListener);

    // Helper functions for collapsing and expanding nodes.

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d.children.forEach(expand);
            d._children = null;
        }
    }

    var overCircle = function(d) {
        selectedNode = d;
        updateTempConnector();
    };
    var outCircle = function(d) {
        selectedNode = null;
        updateTempConnector();
    };

    // color a node properly
    function colorNode(d) {
        result = "#fff";
        if (d.class === "found") {
            result = "#ff4136"; //red
        } else {
            result = "lightsteelblue"
        }
        return result;
    }

    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

    function centerNode(source) {
        scale = zoomListener.scale();
        x = -source.y0;
        y = -source.x0;
        x = x * scale + viewerWidth / 2;
        y = y * scale + viewerHeight / 2;
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

    // Toggle children function

    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        return d;
    }

    // Toggle children on click.

    function click(d) {
        console.log("Click on:"+d)
        if (d3.event.defaultPrevented) return; // click suppressed
        d = toggleChildren(d);
        update(d);
        centerNode(d);
    }

    function update(source) {
        // Compute the new height, function counts total children of root node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        var levelWidth = [1];
        var childCount = function(level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, root);
        var newHeight = d3.max(levelWidth) * 45; // 45 pixels per line
        tree = tree.size([newHeight, viewerWidth]);

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        nodes.forEach(function(d) {
            //d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
            // alternatively to keep a fixed scale one can set a fixed depth per level
            // Normalize for fixed-depth by commenting out below line
            d.y = (d.depth * 300); //500px per level.
        });

        // Update the nodes…
        node = svgGroup.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', click);

        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", colorNode)
            .style("stroke", function(d) {
                if (d.class === "found") {
                    return "#2E8B57"; // seagreen
                }else{
                    return "black";
                }
            })
            .on("mouseenter", function(d) {
                tooltipInfo = nodeToolTip(d);
                if (d.display_name) {
                    div.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                    div.html(tooltipInfo.html)
                        .style("left", (d3.event.pageX + 20) + "px")
                        .style("top", (d3.event.pageY - 5) + "px");
                }
            });

        nodeEnter.append("text")
            .attr("x", function(d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("dy", ".35em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            })
            .style("fill-opacity", 0);

        // phantom node to give us mouseover in a radius around it
        nodeEnter.append("circle")
            .attr('class', 'ghostCircle')
            .attr("r", 30)
            .attr("opacity", 0.2) // change this to zero to hide the target area
            .style("fill", "red")
            .attr('pointer-events', 'mouseover')
            .on("mouseover", function(node) {
                overCircle(node);
                div
                .html("Info about " + d.info)
                .style("left", (d3.event.pageX ) + "px")
                .style("top", (d3.event.pageY) + "px");
            

            })
            .on("mouseout", function(node) {
                outCircle(node);
            });

        // Update the text to reflect whether node has children or not.
        node.select('text')
            .attr("x", function(d) {
                return d.children || d._children ? -nodeTextOffset : nodeTextOffset;
            })
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            });


        // Change the circle fill depending on whether it has children and is collapsed
        node.select("circle.nodeCircle")
            //.attr("r", 4.5)
            .attr("r", 8)
            .style("fill", colorNode);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…
        var link = svgGroup.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal)
            // .style("stroke", function(d) {
            //     if (d.target.class === "found") {
            //           return "#2E8B57"; // seagreen
            //     }
            //     else{
            //         return '';
            //     }
            // }
            // );

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: 0,
                    y: 1
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    outer_update = update;
    outer_centerNode = centerNode;

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    // Define the root
    root = treeData;
    root.x0 = viewerHeight / 2;
    root.y0 = 0;

    // Layout the tree initially and center on the root node.
    update(root);
    centerNode(root);
    tree_root = root;

    select2Data = [];
    select2DataCollectName(root);
    select2DataObject = [
        {id:0, "text":"Part 1"},
        {id:41, "text":"Part 2"},
        {id:42, "text":"Part 3"},
        {id:43, "text":"Part 4"},
        {id:44, "text":"Part 5"},
        {id:45, "text":"Part 6"},
        {id:46, "text":"Part 7"},
        {id:1, "text":"Housing Act 1985"},
        {id:2, "text":"Local Government and Housing Act 1989"},
        {id:3, "text":"Fire and Rescue Services Act 2004"},
        {id:4, "text":"Law of Property 1925"},
        {id:5, "text":"Housing Grants Construction and Regeneration Act 1996"},
        {id:6, "text":"London Building Acts (Amendment) 1939"},
        {id:7, "text":"County of Merseyside Act 1980"},
        {id:8, "text":"Building Act 1984"},
        {id:9, "text":"Leicestershire Act 1985"},
        {id:10, "text":"Housing and Planning Act 2016"},
        {id:11, "text":"Sexual Offences Act 2003"},
        {id:12, "text":"Welfare Reform Act 2012"},
        {id:13, "text":"Social Security Contributions and Benefits Act 1992"},
        {id:14, "text":"Housing Act 1988"},
        {id:15, "text":"Housing and Regeneration Act 2008"},
        {id:16, "text":"Housing Act 1996"},
        {id:17, "text":"Interpretation Act 1978"},
        {id:18, "text":"Rent Act 1977"},
        {id:19, "text":"Rent (Agriculture) Act 1976"},
        {id:20, "text":"Town and Country Planning Act 1990"},
        {id:21, "text":"Housing Act 2004"},
        {id:22, "text":"Crime and Disorder Act 1998"},
        {id:23, "text":"Anti-social Behaviour Act 2003"},
        {id:24, "text":"Mobile Homes Act 1983"},
        {id:25, "text":"Caravan Sites Act 1968"},
        {id:26, "text":"Criminal Justice Act 2003"},
        {id:27, "text":"Deregulation Act 2015"},
        {id:28, "text":"Sustainable Energy Act 2003"},
        {id:29, "text":"Home Energy Conservation 1995"},
        {id:30, "text":"Control of Development Act 1960"},
        {id:31, "text":"Mobile Homes (Wales) 2013"},
        {id:32, "text":"Tribunals, Courts and Enforcement Act 2007"},
        {id:33, "text":"Social Security Administration Act 1992"},
        {id:34, "text":"Local Government Act 1972"},
        {id:35, "text":"Local Government Finance Act 1992"},
        {id:36, "text":"Communications Act 2003"},
        {id:37, "text":"Compulsory Purchase Act 1965"},
        {id:38, "text":"Compulsory Purchase (Vesting Declarations) Act 1981"},
        {id:40, "text":"residential premises"}
    ];

    select2Data
    //     .sort(function(a, b) {
    //     if (a > b) return 1; // sort
    //     if (a < b) return -1;
    //     return 0;
    // })
         .filter(function(item, i, ar) {
            return ar.indexOf(item) === i;
        }) // remove duplicate items
        .filter(function(item, i, ar) {
            // select2DataObject.push({
            //     "id": i,
            //     "text": item
            // });
        });
    select2Data.sort(function(a, b) {
        if (a > b) return 1; // sort
        if (a < b) return -1;
        return 0;
    })
        .filter(function(item, i, ar) {
            return ar.indexOf(item) === i;
        }) // remove duplicate items
        .filter(function(item, i, ar) {
            // select2DataObject.push({
            //     "id": i,
            //     "text": item
            // });
        });
    $("#searchName").select2({
        data: select2DataObject,
        containerCssClass: "search",
        placeholder: "Acts"
    });


}
