$(function(){ // on dom ready

    function createCY(){
        return cytoscape({
            container: document.getElementById('cy'),

            autounselectify: true,
            style: [
                    {
                        selector: 'node',
                        css: {
                            'content': 'data(name)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            //'text-outline-color': '#ccc',
                            //'background-color': '#ccc',
                            //'text-outline-width': 2
                        }
                    },
                    {
                        selector: 'edge',
                        css: {
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier'
                        }
                    },
                ],

            });
    }
    var cy = createCY();
        /*$.ajax('http://localhost:8080?id=103720', {}).done(function(data){
        vertexes = [{data: {id: 103720, name: 'Fernando Pedone'}}];
        edges = [];
        for (var v in data.vtx)
            vertexes.push({data: {id: data.vtx[v].id, name: data.vtx[v].name}})
        for (var e in data.edg)
            edges.push({data: {source: data.edg[e].from, target: data.edg[e].to}});
        cy.add(vertexes);
        cy.add(edges);
        cy.layout({
            name: 'dagre'
        });
        cy.fit();
        console.log(data);
    });

    $.ajax('http://localhost:8080/search?id=103720', {}).done(function(data){
        vertexes = [{data: {id: 103720, name: 'Fernando Pedone'}}];
        edges = [];
        for (var v in data.vtx)
            vertexes.push({data: {id: data.vtx[v].id, name: data.vtx[v].name}})
        for (var e in data.edg)
            edges.push({data: {source: data.edg[e].from, target: data.edg[e].to}});
        cy.add(vertexes);
        cy.add(edges);
        cy.layout({
            name: 'dagre'
        });
        cy.fit();
        console.log(data);
    });
    */
    function executeQuery(){
        cy = createCY();
        var vertexes = [];
        var edges = [];
        
        $("#alert").addClass('hidden');
        $('.btn').button('loading');
        $('#search').button('loading');

        $.ajax('http://localhost:8080/search?name=' + $('#search').val(), {})
            .then(function(data){
                //Found just one :-)
                if (data.length === undefined)
                {
                    vertexes = [{data: {id: data.id, name: data.name}}];
                    return $.ajax('http://localhost:8080?id=' + data.id, {});
                }
                else
                {
                    return {vtx: data};
                }
            })
            .then(function(data){
                console.log(data);
                for (var v in data.vtx)
                    vertexes.push({data: {id: data.vtx[v].id, name: data.vtx[v].name}})
                for (var e in data.edg)
                    edges.push({data: {source: data.edg[e].from, target: data.edg[e].to}});

                cy.add(vertexes);
                cy.add(edges);
                if (data.edg === undefined)
                    cy.layout({
                        name: 'circle'
                    })
                else
                    cy.layout({
                        name: 'dagre'
                    });
                cy.fit();
                cy.on('tap', 'node', function(){
                    $('#search').val(this.data('name'))
                });

                $('#search').button('reset');
                $('.btn').button('reset');

            }).fail(function(err){
                $("#alert").removeClass('hidden');
                console.error(err);
                $('#search').button('reset');
                $('.btn').button('reset');
            });
    }
    $('#search').keypress(function (e) {
        if (e.which == 13)
            executeQuery();
    });

    $('.btn').on('click', function() {
        executeQuery();
    });
});
