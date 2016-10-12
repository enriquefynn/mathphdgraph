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
    var vertexes = [];
    var edges = [];
    function executeQuery(){
        cy = createCY();
        vertexes = [];
        edges = [];
        
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
                console.log(data);
                for (var v in data.vtx)
                    vertexes.push({data: {id: data.vtx[v].id, name: data.vtx[v].name, 
                        faculty: data.vtx[v].faculty, year: data.vtx[v].year}});
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
                            vertexes = [{data: {id: data.vtx[v].id, name: data.vtx[v].name, 
                                faculty: data.vtx[v].faculty, year: data.vtx[v].year}}];
                            edges = [];
                            for (var v in new_data.vtx)
                                vertexes.push({data: {id: new_data.vtx[v].id, name: new_data.vtx[v].name, 
                                    faculty: new_data.vtx[v].faculty, year: new_data.vtx[v].year}})
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

    $('#dot').on('click', function(){
        download('graph.dot', to_dot(vertexes, edges));
    });

    function to_dot(vertexes, edges){
        var dot_file = 'digraph G {\n\tnode [shape=\"box\"];\n\tnodesep=0.7;\n'
        for (let v in vertexes)
        {
            dot_file += '\t' + vertexes[v].data.id + 
            ' [label = \"' + vertexes[v].data.name + '\n';
            if (vertexes[v].data.faculty != null)
                dot_file += vertexes[v].data.faculty;
            if (vertexes[v].data.year != null)
                dot_file += ' ' + vertexes[v].data.year;
            dot_file += '\"]\n';
        }
        for (let e in edges)
            dot_file += '\t' + edges[e].data.source + '->' + edges[e].data.target + ';\n'

        dot_file += '}\n'
        return dot_file;
    }
    function download(filename, text) {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);

        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        }
        else {
            pom.click();
        }
    }
});
