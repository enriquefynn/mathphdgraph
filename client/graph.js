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
                    return data;
                }
            })
            .then(function(data){
                for (var v in data.vtx)
                    vertexes.push({data: {id: data.vtx[v].id, name: data.vtx[v].name}})
                for (var e in data.edg)
                    edges.push({data: {source: data.edg[e].from, target: data.edg[e].to}});

                cy.add(vertexes);
                cy.add(edges);
                if (data.edg === undefined)
                {
                     $('#option_table').append('<tr><td>Name</td><td>Faculty</td><td>Year</td></tr>');
                    for (var i in data)
                        $('#option_table').append('<tr><td>'+
                            data[i].name + '</td>' +
                            '<td>' + data[i].faculty + '</td>' +
                            '<td>' + data[i].year + '</td>' + '</tr>');
                    $('#option_table').find('tr').click(function(){
                        $('.btn').button('loading');
                        $('#search').button('loading');
                        $("#option_table").empty();

                        var idx = $(this).index() - 1;
                        if (idx == -1) idx = 0;
                        //FIXME: Duplicate code
                        return $.ajax('http://localhost:8080?id=' + data[idx].id, {}).then(function(new_data){
                            $('#search').button('reset');
                            $('.btn').button('reset');


                            cy = createCY();
                            vertexes = [{data: {id: data[idx].id, name: data[idx].name}}];
                            edges = [];
                            for (var v in new_data.vtx)
                                vertexes.push({data: {id: new_data.vtx[v].id, name: new_data.vtx[v].name}})
                            for (var e in new_data.edg)
                                edges.push({data: {source: new_data.edg[e].from, target: new_data.edg[e].to}});
                            cy.add(vertexes);
                            cy.add(edges);
                            cy.layout({
                                name: 'dagre'
                            });
                            cy.fit();
                        });
                    });
                }
                cy.layout({
                    name: 'dagre'
                });

                cy.fit();
                $('#search').button('reset');
                $('.btn').button('reset');
                

            }).fail(function(err){
                $("#alert").removeClass('hidden');
                $('#search').button('reset');
                $('.btn').button('reset');

                console.error(err);
            });
    }
    $('#search').keypress(function (e){
        if (e.which == 13)
            executeQuery();
    });

    $('#confirm').on('click', function(){
        executeQuery();
    });

});
