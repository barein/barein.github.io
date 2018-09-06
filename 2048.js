(function ($) {
 
    $.fn.play2048 = function(size2048 = 4, divSizePx = 600) {

        var DivGame = this; //Référence "en dur" pour élargir la portée à tous les scopes
        nbBox = size2048*size2048; //Nbre cases plateau de jeu

        /*Insertion des div dynamiquement dans le plateau de jeu en position absolu /r au plateau
        selon les dimensions du plateau et selon le taille du 2048*/
            
            //Style du plateau de jeu
        var padding = (size2048+1)*10;

        DivGame.css({
            "position" : "absolute",
            "padding-right" : padding,
            "padding-bottom" : padding,
            "width" : divSizePx,
            "height" : divSizePx,
            "background-color" : "rgba(187, 173, 160, 0)",
            "border-radius": "5px"
        }).addClass("game");

            //Pour compatibilité avec bootstrap enveloppement du DivGame
        DivGame.wrap("<div id = 'gameWrapper' />");
        
        $("#gameWrapper").css({
            "position" : "relative",
            "border" : "1px solid black",
            "width" : (divSizePx + padding),
            "height" : divSizePx + padding,
            "background-color" : "rgba(187, 173, 160)",
            "border-radius": "5px",
            "margin" : "auto",
            "margin-top" : 10,
            "margin-bottom" : 10

        });

            //Insertion + Style des box + box arrière plan
        for(let i=0; i < nbBox; i++)
        {
            //box de jeu
            this.append(
                $("<div />").attr("id", i).css(
                    {
                        "position": "absolute",
                        "width" : (parseInt(this.css("width"))/size2048)+"px",
                        "height" : (parseInt(this.css("height"))/size2048)+"px",
                        "background-color": "bisque",
                        "border": "0.5px solid black",
                        "border-radius": "5px",
                        "display" : "flex"
                    }
                ).addClass("box")
                .append($("<p />").css("margin", "auto"))
            );
            //box d'arrière plan
            this.append(
                $("<div />").attr("attr", i).css(
                    {
                        "position": "absolute",
                        "width" : (parseInt(this.css("width"))/size2048)+"px",
                        "height" : (parseInt(this.css("height"))/size2048)+"px",
                        "background-color": "rgba(238, 228, 218, 0.35)",
                        "border": "0.5px solid black",
                        "border-radius": "5px"
                    }
                ).addClass("box")
            );
        }
        placeBoxes(this, size2048, 0, "attr");//Affichage des box en arrière plan

        /*------------------------ Initialisation du jeu ------------------------------*/ 
        
        var score = {amount : 0};
        var moveMatrix = getNewMatrix(size2048);
        var gameMatrix = getNewMatrix(size2048);

        assignRandomly(2, gameMatrix, size2048);
        assignValueOnId(this, size2048, gameMatrix);
        DivGame.children(".box[id]").hide();
        placeBoxes(this, size2048, 1, "id");
        $("#score").text("Score : " + score.amount);

        /*------------------------ Fin d'initialisation ------------------------------*/
        
        /*------------------------ Gestion Appui sur touche déplacement ---------------*/

        function endMoveCheck()
        {
            //Detection de la victoire
            if(has2048(gameMatrix, size2048))
            {
                $(window).off("keyup");
                if (confirm("C'est gagné ! Voulez-vous rejouer ?"))
                {
                    resetGame();
                }
            }

            //Detection gameOver
            else if(getEmptyBoxes(gameMatrix, size2048).length === 0 && !has2048(gameMatrix, size2048) && !hasMerge(gameMatrix, size2048))
            {
                $(window).off("keyup");
                if (confirm("C'est perdu ! Voulez-vous rejouer ?"))
                {
                    resetGame();
                }
            }
        
        }

        function initKeyEvents()
        {
            $(window).on("keyup", function(e){
            
                if(e.key === "ArrowLeft")
                {
                    let nbMerge = mergeLeft(gameMatrix, moveMatrix, size2048, score);
                    move("left", gameMatrix, moveMatrix, $(".game"), size2048, nbMerge);
                }
                else if(e.key === "ArrowRight")
                {
                    let nbMerge = mergeRight(gameMatrix, moveMatrix, size2048, score);
                    move("right", gameMatrix, moveMatrix, $(".game"), size2048, nbMerge);
                }
                else if(e.key === "ArrowUp")
                {
                    let nbMerge = mergeTop(gameMatrix, moveMatrix, size2048, score);
                    move("top", gameMatrix, moveMatrix, $(".game"), size2048, nbMerge);
                }
                else if(e.key === "ArrowDown")
                {
                    let nbMerge = mergeDown(gameMatrix, moveMatrix, size2048, score);
                    move("down", gameMatrix, moveMatrix, $(".game"), size2048, nbMerge);
                }

                $("#score").text("Score : " + score.amount);
                endMoveCheck();

            });
        };

        initKeyEvents();

        /*--------------- Gestion de la confirmation du reset game après victoire/défaite ------------------*/
        function resetGame()
        {
            console.log("Reset game in 10 sec")

            setTimeout(function()
            {
                console.log("Reseting...")
                score.amount = 0;
                moveMatrix = getNewMatrix(size2048);
                gameMatrix = getNewMatrix(size2048);
        
                assignRandomly(2, gameMatrix, size2048);
                assignValueOnId(DivGame, size2048, gameMatrix);
                DivGame.children(".box[id]").hide();
                placeBoxes(DivGame, size2048, 1, "id");

                initKeyEvents();
                $("#score").text("Score : " + score.amount);
            },10000);
                
        };

        $("button#resetGame").on("click", function(){
            
            score.amount = 0;
            moveMatrix = getNewMatrix(size2048);
            gameMatrix = getNewMatrix(size2048);
    
            assignRandomly(2, gameMatrix, size2048);
            assignValueOnId(DivGame, size2048, gameMatrix);
            DivGame.children(".box[id]").hide();
            placeBoxes(DivGame, size2048, 1, "id");
            
            initKeyEvents();
            $("#score").text("Score : " + score.amount);
        });


        return this;
    };

    /*Bouge les nombres dans gameMatrix et selon leur id dans le plateau de jeu + ENSUITE appelle assignValueOnId et placeBoxes.
    A appeler après un mergeDirection()*/
    function move(direction, gameMatrix, moveMatrix, JQElmt, size2048, nbMerge)
    {
        var DivGame = JQElmt;
        var boxes = JQElmt.children(".box[id]");
        var nbBox = size2048*size2048;

        var boxWidth = parseInt(JQElmt.css("width"))/size2048;
        var boxHeight = parseInt(JQElmt.css("height"))/size2048;

        var animationSpeed = 200;

        //DEBUG des mouvements haut et bas : matrice des id des box dans plateau de jeu
        var idsMatrix = getNewMatrix(size2048);

        for(let i = 0; i < nbBox; i++)
        {
            idsMatrix[Math.floor(i/size2048)][i%size2048] = i;
        }

        //Nombre de mouvements qui seront effectuées
        var sumMoves = 0;

        if(direction === "left")
        {   

            for(let i = 0; i < nbBox; i++)
            {
                //Déplacements sur ligne dans gameMatrix : changement de colonne
                let nbMove = moveMatrix[Math.floor(i/size2048)][i%size2048];
                
                gameMatrix[Math.floor(i/size2048)][(i-nbMove)%size2048] = gameMatrix[Math.floor(i/size2048)][i%size2048];

                //Si déplacement alors case en cours à 0
                if(nbMove !== 0 )
                {
                    sumMoves++;
                    gameMatrix[Math.floor(i/size2048)][i%size2048] = 0;
                }
                //Déplacements sur ligne dans le plateau de jeu
                $(boxes[i]).animate(
                    {
                        left : "-=" + boxWidth*nbMove + "px"
                    },
                    animationSpeed,
                    "linear",
                    function(){
                        $(this).hide();
                       
                        assignValueOnId(DivGame, size2048, gameMatrix);
                        placeBoxes(DivGame, size2048, 1, "id");

                    }
                )
                //Fin du déplacement de la box, valeur du déplacement réinitialisée
                moveMatrix[Math.floor(i/size2048)][i%size2048] = 0;
            }
            //S'il y a eu des mouvements et/ou des fusions
            if(sumMoves !== 0 || nbMerge !== 0) 
            {
                assignRandomly(1, gameMatrix, size2048);
                sumMoves = 0;
            }
            
        }
        else if(direction === "right")
        {
            
            for(let i = nbBox-1; i >= 0; i--)
            {
                //Déplacements sur ligne dans gameMatrix : changement de colonne
                let nbMove = moveMatrix[Math.floor(i/size2048)][i%size2048];

                gameMatrix[Math.floor(i/size2048)][(i+nbMove)%size2048] = gameMatrix[Math.floor(i/size2048)][i%size2048];
                
                //Si déplacement alors case en cours à 0
                if(nbMove !== 0 )
                {
                    sumMoves++;
                    gameMatrix[Math.floor(i/size2048)][i%size2048] = 0;
                }
                //Déplacements sur ligne dans le plateau de jeu
                $(boxes[i]).animate(
                    {
                        left : "+=" + boxWidth*nbMove + "px"
                    },
                    animationSpeed,
                    "linear",
                    function(){
                        $(this).hide();
                       
                        assignValueOnId(DivGame, size2048, gameMatrix);
                        placeBoxes(DivGame, size2048, 1, "id");

                    }
                )
                //Fin du déplacement de la box, valeur du déplacement réinitialisée
                moveMatrix[Math.floor(i/size2048)][i%size2048] = 0;
            }
            //S'il y a eu des mouvement et/ou des fusions
            if(sumMoves !== 0 || nbMerge !== 0) 
            {
                assignRandomly(1, gameMatrix, size2048);
                sumMoves = 0;
            }

            
        }
        else if(direction === "top")
        {
            
            for(let i = 0; i < nbBox; i++)
            {
                //Déplacements sur colonne dans gameMatrix : changement de ligne
                let nbMove = moveMatrix[i%size2048][Math.floor(i/size2048)];

                gameMatrix[(i-nbMove)%size2048][Math.floor(i/size2048)] = gameMatrix[i%size2048][Math.floor(i/size2048)];
                
                //Si déplacement alors case en cours à 0
                if(nbMove !== 0)
                {
                    sumMoves++;
                    gameMatrix[i%size2048][Math.floor(i/size2048)] = 0;
                }

                //Déplacements sur colonne dans le plateau de jeu
                let idBox = idsMatrix[i%size2048][Math.floor(i/size2048)]; //Correspondance entre itération en cours et id de la box
               
                $(boxes[idBox]).animate(
                    {
                        top : "-=" + boxHeight*nbMove + "px"
                    },
                    animationSpeed,
                    "linear",
                    function(){
                        $(this).hide();
                    
                        assignValueOnId(DivGame, size2048, gameMatrix);
                        placeBoxes(DivGame, size2048, 1, "id");

                    }
                )
                //Fin du déplacement de la box, valeur du déplacement réinitialisée
                moveMatrix[i%size2048][Math.floor(i/size2048)] = 0;
            }
            //S'il y a eu des mouvement et/ou des fusions
            if(sumMoves !== 0 || nbMerge !== 0) 
            {
                assignRandomly(1, gameMatrix, size2048);
                sumMoves = 0;
            }
    
        }
        else if(direction === "down")
        {
            
            for(let i = nbBox-1; i >= 0; i--)
            {
                //Déplacements sur colonne dans gameMatrix : changement de ligne
                let nbMove = moveMatrix[i%size2048][Math.floor(i/size2048)];

                gameMatrix[(i+nbMove)%size2048][Math.floor(i/size2048)] = gameMatrix[i%size2048][Math.floor(i/size2048)];
                
                //Si déplacement alors case en cours à 0
                if(nbMove !== 0)
                {
                    sumMoves++;
                    gameMatrix[i%size2048][Math.floor(i/size2048)] = 0;
                }

                //Déplacements sur colonne dans le plateau de jeu
                let idBox = idsMatrix[i%size2048][Math.floor(i/size2048)]; //Correspondance entre itération en cours et id de la box
                
                $(boxes[idBox]).animate(
                    {
                        top : "+=" + boxHeight*nbMove + "px"
                    },
                    animationSpeed,
                    "linear",
                    function(){
                        $(this).hide();
                    
                        assignValueOnId(DivGame, size2048, gameMatrix);
                        placeBoxes(DivGame, size2048, 1, "id");

                    }
                )
                //Fin du déplacement de la box, valeur du déplacement réinitialisée
                moveMatrix[i%size2048][Math.floor(i/size2048)] = 0;
            }
            //S'il y a eu des mouvement et/ou des fusions
            if(sumMoves !== 0 || nbMerge !== 0) 
            {
                assignRandomly(1, gameMatrix, size2048);
                sumMoves = 0;
            }
        }
    }

    /* Renvoi le nbre de fusion, gameMatrix dans son état "Fusionné" mais non bougé, et moveMatrix remplie*/
    function mergeLeft(gameMatrix, moveMatrix, size2048, score)
    {
        var nbBox = size2048*size2048;
        var nbMerge = 0;

        var nbSpace = 0;
        var prevVal = null;
        var prevValId = null;

        for(let i = 0; i < nbBox; i++)
        {

            if(i%size2048 === 0)//Nouvelle ligne, réinitialisation des buffers
            {
                nbSpace = 0;
                prevVal = null;
                prevValId = null;
            }

            var currentVal = gameMatrix[Math.floor(i/size2048)][i%size2048];
            
            if(currentVal === 0) //case "vide"
            {
                nbSpace++;
            }
            else
            {
                if(currentVal === prevVal) //Fusion
                {
                    //Stockage du nbr de vides avant la 2nd case identique dans moveMatrix
                    moveMatrix[Math.floor(i/size2048)][i%size2048] = nbSpace;
                    //Doublage de la valeur de la 1ere case identique dans gameMatrix
                    gameMatrix[Math.floor(prevValId/size2048)][prevValId%size2048] = prevVal*2;
                    //Mise à 0 de la 2nd case identique dans moveMatrix (case en cours)
                    gameMatrix[Math.floor(i/size2048)][i%size2048] = 0;

                    //Gestion des buffers
                    nbSpace++; //Fusion => libération d'un espace
                    nbMerge++;
                    score.amount += prevVal*2
                    prevVal = null;
                    prevValId = null;
                }
                else
                {
                    moveMatrix[Math.floor(i/size2048)][i%size2048] = nbSpace;

                    prevVal = currentVal;
                    prevValId = i;

                }
            }
        } 
        return nbMerge;
    }

    function mergeRight(gameMatrix, moveMatrix, size2048, score)
    {
        var nbBox = size2048*size2048;
        var nbMerge = 0;

        var nbSpace = 0;
        var prevVal = null;
        var prevValId = null;

        for(let i = nbBox-1 ; i >= 0; i--)
        {

            if(i%size2048 === (size2048-1))//Nouvelle ligne, réinitialisation des buffers
            {
                nbSpace = 0;
                prevVal = null;
                prevValId = null;
            }

            var currentVal = gameMatrix[Math.floor(i/size2048)][i%size2048];
            
            if(currentVal === 0) //case "vide"
            {
                nbSpace++;
            }
            else
            {
                if(currentVal === prevVal) //Fusion
                {
                    //Stockage du nbr de vides avant la 2nd case identique dans moveMatrix
                    moveMatrix[Math.floor(i/size2048)][i%size2048] = nbSpace;
                    //Doublage de la valeur de la 1ere case identique dans gameMatrix
                    gameMatrix[Math.floor(prevValId/size2048)][prevValId%size2048] = prevVal*2;
                    //Mise à 0 de la 2nd case identique dans moveMatrix (case en cours)
                    gameMatrix[Math.floor(i/size2048)][i%size2048] = 0;

                    //Gestion des buffers
                    nbSpace++; //Fusion => libération d'un espace
                    nbMerge++;
                    score.amount+=prevVal*2;
                    prevVal = null;
                    prevValId = null;
                }
                else
                {
                    moveMatrix[Math.floor(i/size2048)][i%size2048] = nbSpace;

                    prevVal = currentVal;
                    prevValId = i;

                }
            }
        } 

        return nbMerge;
    }

    function mergeTop(gameMatrix, moveMatrix, size2048, score)
    {
        var nbBox = size2048*size2048;
        var nbMerge = 0;

        var nbSpace = 0;
        var prevVal = null;
        var prevValId = null;

        for(let i = 0; i < nbBox; i++)
        {

            if(((i/size2048)%1) === 0)//Nouveau HAUT de colonne, réinitialisation des buffers
            {
                nbSpace = 0;
                prevVal = null;
                prevValId = null;
            }

            var currentVal = gameMatrix[i%size2048][Math.floor(i/size2048)];
            
            if(currentVal === 0) //case "vide"
            {
                nbSpace++;
            }
            else
            {
                if(currentVal === prevVal) //Fusion
                {
                    //Stockage du nbr de vides avant la 2nd case identique dans moveMatrix
                    moveMatrix[i%size2048][Math.floor(i/size2048)] = nbSpace;
                    //Doublage de la valeur de la 1ere case identique dans gameMatrix
                    gameMatrix[prevValId%size2048][Math.floor(prevValId/size2048)] = prevVal*2;
                    //Mise à 0 de la 2nd case identique dans moveMatrix (case en cours)
                    gameMatrix[i%size2048][Math.floor(i/size2048)] = 0;

                    //Gestion des buffers
                    nbSpace++; //Fusion => libération d'un espace
                    nbMerge++;
                    score.amount += prevVal*2
                    prevVal = null;
                    prevValId = null;
                }
                else
                {
                    moveMatrix[i%size2048][Math.floor(i/size2048)] = nbSpace;

                    prevVal = currentVal;
                    prevValId = i;

                }
            }
        } 

        return nbMerge;
    }

    function mergeDown(gameMatrix, moveMatrix, size2048, score)
    {
        var nbBox = size2048*size2048;
        var nbMerge = 0;

        var nbSpace = 0;
        var prevVal = null;
        var prevValId = null;

        for(let i = nbBox-1 ; i >= 0; i--)
        {

            if((((i+1)/size2048)%1) === 0)//Nouveau BAS de colonne, réinitialisation des buffers
            {
                nbSpace = 0;
                prevVal = null;
                prevValId = null;
            }

            var currentVal = gameMatrix[i%size2048][Math.floor(i/size2048)];
            
            if(currentVal === 0) //case "vide"
            {
                nbSpace++;
            }
            else
            {
                if(currentVal === prevVal) //Fusion
                {
                    //Stockage du nbr de vides avant la 2nd case identique dans moveMatrix
                    moveMatrix[i%size2048][Math.floor(i/size2048)] = nbSpace;
                    //Doublage de la valeur de la 1ere case identique dans gameMatrix
                    gameMatrix[prevValId%size2048][Math.floor(prevValId/size2048)] = prevVal*2;
                    //Mise à 0 de la 2nd case identique dans moveMatrix (case en cours)
                    gameMatrix[i%size2048][Math.floor(i/size2048)] = 0;

                    //Gestion des buffers
                    nbSpace++; //Fusion => libération d'un espace
                    nbMerge++;
                    score.amount += prevVal*2
                    prevVal = null;
                    prevValId = null;
                }
                else
                {
                    moveMatrix[i%size2048][Math.floor(i/size2048)] = nbSpace;

                    prevVal = currentVal;
                    prevValId = i;

                }
            }
        } 

        return nbMerge;
    }
    /*Vérifie la possibilité de fusion dans la matrice */
    function hasMerge(gameMatrix, size2048)
    {

        var nbBox = size2048*size2048;
        var nbMerge = 0;

        var prevVal = null;
        var prevValId = null;

        //Merges en ligne
        for(let i = 0; i < nbBox; i++)
        {

            if(i%size2048 === 0)//Nouvelle ligne, réinitialisation des buffers
            {
                prevVal = null;
                prevValId = null;
            }

            var currentVal = gameMatrix[Math.floor(i/size2048)][i%size2048];
            
            //Fusion
            if((currentVal !== 0) && (currentVal === prevVal)) 
            {
                    //Gestion des buffers
                    nbMerge++;

                    prevVal = null;
                    prevValId = null;
            }
            else if((currentVal !== 0) && (currentVal !== prevVal))
            {
                prevVal = currentVal;
            }
        }

        //Réinititalisation des buffers
        prevVal = null;
        prevValId = null;


        //Merges en colonne
        for(let i = 0; i < nbBox; i++)
        {

            if(((i/size2048)%1) === 0)//Nouveau HAUT de colonne, réinitialisation des buffers
            {
                prevVal = null;
                prevValId = null;
            }

            var currentVal = gameMatrix[i%size2048][Math.floor(i/size2048)];
            
            //Fusion
            if((currentVal !== 0) && (currentVal === prevVal)) 
            {
                    //Gestion des buffers
                    nbMerge++;

                    prevVal = null;
                    prevValId = null;
            }
            else if((currentVal !== 0) && (currentVal !== prevVal))
            {
                prevVal = currentVal;
            }
        }

        if(nbMerge > 0)
        {
            return true;
        }
        else
        {
            return false;
        }
        
    }

    /*Assign to a random empty position on the gameMatrix a defined number of 2 or 4*/
    function assignRandomly(nbToPlace, gameMatrix, size2048)
    {
        for(let i = 0; i < nbToPlace; i++)
        {
            let listEmptyBoxes = getEmptyBoxes(gameMatrix, size2048);
            let randomIndex = Math.floor(Math.random()*listEmptyBoxes.length);
            let randomPosition = listEmptyBoxes[randomIndex];

            gameMatrix[Math.floor(randomPosition/size2048)][randomPosition%size2048] = get2or4();
        }
    }

    function has2048(gameMatrix, size2048)
    {
        var nbBox = size2048*size2048;

        for(let i = 0; i < nbBox; i++)
        {
            if(gameMatrix[Math.floor(i/size2048)][i%size2048] === 2048)
            {
                return true;
            }
        }
    }

    function getEmptyBoxes(gameMatrix, size2048)
    {
        var nbBox = size2048*size2048;
        var emptyPositions = [];

        for(let i = 0; i < nbBox; i++)
        {
            if(gameMatrix[Math.floor(i/size2048)][i%size2048] === 0)
            {
                emptyPositions.push(i);
            }
        }

            return emptyPositions;
    }

    /*get a 2 or a 4*/
    function get2or4()
    {
        var tab = [2,2,2,2,2,2,2,4,4,4];
        var randomIndex = Math.floor(Math.random()*tab.length);

        return tab[randomIndex];
    }

    function getNewMatrix(size)
    {
        var matrix = [];
        for(let i = 0; i < size; i++)
        {
            matrix.push([]);
        }

        matrix.forEach(function(tab){
            for(let i = 0; i < size; i++)
            {
                tab.push(0);
            }
        });

        return matrix;
    }

    /*Remplace le contenu texte des div du plateau de jeu avec la valeur dans la matrice selon l'id des div */
    function assignValueOnId(JQElmt, size2048, gameMatrix)
    {
        var nbBox = size2048*size2048;

        var boxes = JQElmt.children(".box[id]");

        for(let i = 0; i < nbBox; i++)
        {
            let nbToAssign = gameMatrix[Math.floor(i/size2048)][i%size2048]
            if(nbToAssign !== 0)
            {
                $(boxes[i]).children("p").text(gameMatrix[Math.floor(i/size2048)][i%size2048]);
            }
            else
            {
                $(boxes[i]).children("p").empty();
            }
            
        }
    }
    /*Place les box selon leur id dans le plateau de jeu + gère l'effet d'apparition à chaque nvl etat de la matrice */
    function placeBoxes(JQElmt, size2048, zIndex=1, attribut)
    {
        var boxes = JQElmt.children(".box["+ attribut +"]");
        
        var nbBox = size2048*size2048;

        var boxWidth = parseInt(JQElmt.css("width"))/size2048;
        var boxHeight = parseInt(JQElmt.css("height"))/size2048;

        //Couleurs du jeu

        var colors = [];
            colors[2]   = "#fff4e6";
            colors[4]   = "#ffe8cc";
            colors[8]   = "#ffd8a8";
            colors[16]  = "#ffc078";
            colors[32]  = "#ffa94d";
            colors[64]  = "#ff922b";
            colors[128] = "#fd7e14";
            colors[256] = "#f76707";
            colors[512] = "#e8590c";
            colors[1024] = "#d9480f";
            colors[2048] = "#c92a2a";

        for(let i = 0; i < nbBox; i++)
        {
            let offset = 10;
            let left = (i%size2048)*boxWidth + ((i%size2048)+1)*offset ;
            let top = Math.floor(i/size2048)*boxHeight + (Math.floor(i/size2048)+1)*offset;

            $(boxes[i]).css(
                {
                    "left" : left + "px",
                    "top" : top + "px",
                    "z-index" : zIndex
                }
            )

            let boxText = $(boxes[i]).children("p").text();
            
            if(attribut === "id" && boxText !== "")
            {
                $(boxes[i]).css("background-color", colors[parseInt(boxText)]);
                $(boxes[i]).show();
            }
             
        }
        

    }

}(jQuery));