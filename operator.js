/*global fetch*/
(function(){
    function cap(s){
        if(s.length == 0){
            return "";
        }
        return s[0].toUpperCase() + s.slice(1);
    }
    var Bullet = class{
        constructor(question, content, score, id){
            this._question = question;
            this._content = cap(content);
            this._score = score;
            this._id = id;
        }
        
        get question(){
            return this._question;
        }
        
        get content(){
            return this._content;
        }
        
        get score(){
            return this._score;
        }
        
        get id(){
            return this._id;
        }
        
        set question(x){
            this._question = x.trim();
        }
        
        set content(x){
            this._content = cap(x.replaceAll("\n", " ").trim());
        }
        
        set score(x){
            this._score = x.trim();
        }
    };

    var Rubric = class{
        constructor(fullScore){
            this._fullScore = fullScore;
            this._bullet_map = new Map();
            this._cnt = 0;
        }
        
        get fullScore(){
            return this._fullScore;
        }
        
        set fullScore(x){
            this._fullScore = x;
        }
        
        addBullet(question, content, score){
            var duplicate = false;
            var dup_id = null;
            for(const [id, bullet] of this._bullet_map){
                if(bullet.question === question && bullet.score === score && bullet.content === content){
                    duplicate = true;
                    dup_id = id;
                    break;
                }
            }
            if(duplicate){
                return dup_id;
            }
            var newBullet = new Bullet(question, content, score, this.cnt);
            this._bullet_map.set(this._cnt, newBullet);
            this._cnt++;
            return this._cnt - 1;
        }
        
        editBullet(id, q, c, s){
            var curr = this._bullet_map.get(id);
            var q = q;
            var c = c;
            var s = s;
            curr._question = q;
            curr._content = c;
            curr._score = s;
            this._bullet_map.set(id, curr);
        }
        
        hasBullet(id){
            return this._bullet_map.has(id);
        }
        
        getBullet(id){
            return this._bullet_map.get(id);
        }
        
        removeBullet(id){
            this._bullet_map.delete(id);
        }
        
        get_similarity(arr1, arr2){
            // TODO: Implement It
            // Available operations: Add, Remove, Change
            // dp[i][j] ~ dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]
            var dp = new Array(arr1.length + 1);
            for(var i = 0; i < dp.length; i++){
                dp[i] = new Array(arr2.length + 1);
            }
            for(var i = 0; i < dp[0].length; i++){
                dp[0][i] = i;
            }
            for(var i = 0; i < dp.length; i++){
                dp[i][0] = i;
            }
            for(var i = 1; i < dp.length; i++){
                for(var j = 1; j < dp[i].length; j++){
                    if(arr1[i - 1].toLowerCase().trim() === arr2[j - 1].toLowerCase().trim()){
                        dp[i][j] = dp[i - 1][j - 1];
                    } else{
                        dp[i][j] = dp[i - 1][j - 1] + 1;
                    }
                    dp[i][j] = Math.min(dp[i][j], dp[i - 1][j] + 1);
                    dp[i][j] = Math.min(dp[i][j], dp[i][j - 1] + 1);
                }
            }
            return dp[arr1.length][arr2.length];
        }
        
        check_duplicate(content){
            // TODO: Implement It
            if(this._bullet_map.size == 0){
                return "n/a";
            }
            var lst = [];
            var arr = content.trim().split(" ");
            for(const [id, bullet] of this._bullet_map){
                var curr_arr = bullet.content.trim().split(" ");
                var sim = this.get_similarity(arr, curr_arr);
                lst.push({"id": id, "score": sim});
            }
            lst.sort((a, b) => a.score - b.score);
            var bullet_sim = this._bullet_map.get(lst[0].id);
            var sentence = bullet_sim.score + ": " + bullet_sim.question + ". " + cap(bullet_sim.content);
            return sentence;
        }
    };

    var Student = class{
        constructor(name, rubric){
            this._name = name;
            this._mistakes = new Map();
            this._rubric = rubric;
            this._fullScore = rubric._fullScore
            this._score = rubric._fullScore;
            this._comment = "";
            this._complete = false;
        }
        
        get name(){
            return this._name;
        }
        
        get mistakes(){
            return this._mistakes;
        }
        
        set name(x){
            this._name = x;
        }
        
        set comment(x){
            if(x.trim().length == 0){
                this._comment = "";
            } else{
                this._comment = cap(x.replaceAll("\n", " ").trim());
            }
        }
        
        get comment(){
            return this._comment;
        }
        
        update_score(){
            this._fullScore = this._rubric._fullScore;
            var curr = this._fullScore;
            for(const [mistake, val] of this._mistakes){
                if(this._rubric.hasBullet(mistake)){
                    var s = parseFloat(this._rubric.getBullet(mistake)._score);
                    curr += s;
                }
            }
            this._score = curr;
        }
        
        get score(){
            this.update_score();
            return this._score;
        }
        
        get_score(){
            this.update_score();
            return this._score;
        }
        
        update_comment(){
            if(this._complete && this._comment === "" && this._mistakes.size == 0){
                this._comment = "Great Work!";
            } else{
                if(this._comment === "Great Work!"){
                    this._comment = "";
                }
            }
        }
        
        add_mistake(id, comment = null){
            if(comment !== null){
                comment = comment.replaceAll("\n", " ").trim()
            } else{
                comment = "";
            }
            this._mistakes.set(id, comment);
            this.update_score();
            this.update_comment();
        }
        
        set_status(x){
            this._complete = x;
            this.update_comment();
        }
        
        remove_mistake(id){
            this._mistakes.delete(id);
            this.update_score();
            this.update_comment();
        }
        
        remove_comment(id){
            this._mistakes.set(id, "");
        }
        
        get_result(){
            this.update_score();
            var status = "Incomplete";
            if(this._complete){
                status = "Completed";
            }
            var res = this.name + ": " + this.score;
            res += "\n" + status;
            for(const [mistake, val] of this._mistakes){
                if(this._rubric.hasBullet(mistake)){
                    var error = this._rubric.getBullet(mistake);
                    var sentence = error.score + ": " + error.question + ". " + cap(error.content);
                    if(this._mistakes.get(mistake).length > 0){
                        sentence += " #comment#: " + cap(this._mistakes.get(mistake));
                    }
                    res += "\n" + sentence;
                }
            }
            if(this._comment.trim().length > 0){
                res += "\nFinal Words: " + this._comment;
            }
            return res;
        }
    };

    var Classroom = class{
        constructor(createNew = true, fullScore = null, content = null){
            this._students = new Map();
            if(createNew){
                this.create_new_rubric(fullScore);
            } else{
                this.load_from_file(content);
            }
            this._fullScore = this._rubric._fullScore;
        }
        
        get students(){
            return this._students;
        }
        
        get rubric(){
            return this._rubric;
        }
        
        set students(x){
            this._students = x;
        }
        
        set fullScore(x){
            this._fullScore = x;
        }
        
        update_full_score(x){
            this._fullScore = x;
            this._rubric._fullScore = x;
        }
        
        get_single_student(name){
            return this._students.get(name);
        }
        
        change_student_name(name1, name2){
            var s = this._students.get(name1);
            s.name = name2;
            this._students.delete(name1);
            this._students.set(name2, s);
        }
        
        create_new_rubric(fullScore){
            this._rubric = new Rubric(fullScore);
        }
        
        add_student(name){
            var student = new Student(name, this._rubric);
            this._students.set(name, student);
        }
        
        add_bullet(question, content, score){
            return this._rubric.addBullet(question, content, score);
        }
        
        remove_bullet(id){
            this._rubric.removeBullet(id);
            for(const [name, student] of this._students){
                student.remove_mistake(id);
            }
        }
        
        student_has_mistake(name, id){
            return this._students.get(name)._mistakes.has(id);
        }
        
        student_add_mistake(name, id){
            this._students.get(name).add_mistake(id, null);
        }
        
        student_remove_mistake(name, id){
            this._students.get(name).remove_mistake(id);
        }
        
        remove_student(name){
            this._students.delete(name);
        }
        
        output_for_file(){
            var data = "Full Score: " + this._fullScore;
            for(var [name, val] of this._students){
                data += "\n\n" + this._students.get(name).get_result();
            }
            return data;
        }
        
        load_from_file(content){
            //TODO: A lot of work to be done here!!!
            var content_arr = content.split("\n");
            var fullscore = parseFloat(content_arr[0].split(":")[1].trim());
            this.create_new_rubric(fullscore);
            this._fullScore = fullscore;
            var student_new = true;
            var student_name = "";
            var i = 1;
            while(i < content_arr.length){
                var line = content_arr[i].trim();
                if(line.length == 0){
                    student_new = true;
                } else{
                    if(student_new){
                        var name = line.split(":")[0].trim();
                        i++;
                        var status = content_arr[i].trim();
                        this.add_student(name);
                        this._students.get(name).set_status(status === "Completed");
                        student_name = name;
                    } else{
                        if(line.startsWith("Final")){
                            var final_words = line.split(":")[1].trim();
                            this._students.get(name).comment = final_words;
                        } else{
                            var score = line.split(":")[0].trim();
                            var question = line.split(":")[1].split(".")[0].trim();
                            var q_all = line.substring(line.indexOf(":") + 1);
                            var q_content_both = q_all.substring(q_all.indexOf(".") + 1).trim();
                            var q_content = q_content_both.split("#comment#:")[0].trim();
                            var q_comment = "";
                            if(q_content_both.split("#comment#:").length > 1){
                                q_comment = q_content_both.split("#comment#:")[1].trim();
                            }
                            var id = this.add_bullet(question, q_content, score);
                            this._students.get(name).add_mistake(id, q_comment);
                        }
                    }
                    student_new = false;
                }
                i++;
            }
        }
    };
    
    // Global Variables
    var in_classroom = false;
    var curr_student = "";
    var classroom = null;
    
    var add_bullet_popup = null;
    var bullet_popup_save = null;
    var add_bullet_new = true;
    var bullet_edit_id = null;
    
    var add_student_popup = null;
    var student_popup_save = null;
    var add_student_new = true;
    
    var score_popup_save = null;
    var add_score_popup = null;
    
    var comment_popup_save = null;
    var add_comment_popup = null;
    
    var report_wildcard = "*";
    
    var output_dir = null;
    // Global Variables Stop Here

    function $(id){
        return document.getElementById(id);
    }
    
    function click_bullet(name, id){
        if(!classroom.student_has_mistake(name, id)){
            classroom.student_add_mistake(name, id, null);
        } else{
            classroom.student_remove_mistake(name, id);
        }
        update_page_student(name);
    }
    
    function delete_bullet(id){
        classroom.remove_bullet(id);
        update_page_student(curr_student);
    }
    
    function add_bullet_comment(id, comment){
        var s = classroom._students.get(curr_student);
        s.add_mistake(id, comment);
        update_page_student(curr_student);
    }
    
    function set_student_status(){
        var s = classroom.get_single_student(curr_student);
        if(s._complete){
            s.set_status(false);
        } else{
            s.set_status(true);
        }
        update_page_student(curr_student);
    }
    
    function create_name_header(name, score){
        var h = document.createElement("h2");
        var b = document.createElement("b");
        b.textContent = name;
        var s = document.createTextNode(": " + score + "/" + classroom._fullScore);
        h.appendChild(b);
        h.appendChild(s);
        h.className = "student-header";
        return h;
    }
    
    function create_bullet_block(name, mistake, val, class_name){
        var div_whole = document.createElement("div");
        div_whole.className = class_name;
        var div = document.createElement("div");
        div.id = "Bullet " + mistake;
        div.className = "bullet-content";
        var div_select = document.createElement("div");
        div_select.className = "bullet-click";
        var description_select = document.createTextNode("Select");
        div_select.appendChild(description_select);
        div_select.onclick = function(){
            click_bullet(name, mistake);
        };
        div_whole.appendChild(div_select);
        var bold_score = document.createElement("b");
        bold_score.textContent = val._score;
        var description = document.createTextNode(": " + val._question + ". " + val._content);
        div.appendChild(bold_score);
        div.appendChild(description);
        var div_edit = document.createElement("div");
        div_edit.className = "bullet-edit";
        div_edit.onclick = function(){
            bullet_edit_id = mistake;
            add_bullet_new = false;
            var q = val._question;
            var c = val._content;
            var s = val._score;
            var x = create_bullet_popup(q, c, s);
            add_bullet_popup = x;
            update_page_student(curr_student);
        }
        var description_edit = document.createTextNode("Edit");
        div_edit.appendChild(description_edit);
        var div_delete = document.createElement("div");
        div_delete.onclick = function(){
            delete_bullet(mistake);
        }
        div_delete.className = "bullet-delete";
        var description_delete = document.createTextNode("Delete");
        div_delete.appendChild(description_delete);
        var div_comment = document.createElement("div");
        div_comment.className = "bullet-comment";
        div_comment.onclick = function(){
            bullet_edit_id = mistake;
            var c = classroom.get_single_student(curr_student)._mistakes.get(mistake);
            var x = create_comment_popup(c);
            add_comment_popup = x;
            update_page_student(curr_student);
        }
        var description_comment = document.createTextNode("Comment");
        div_comment.appendChild(description_comment);
        div_whole.appendChild(div);
        div_whole.appendChild(div_edit);
        div_whole.appendChild(div_delete);
        div_whole.appendChild(div_comment);
        return div_whole
    }
    
    function create_student_menu(){
        var div_menu = document.createElement("div");
        div_menu.className = "student-menu";
        var div_add_bullet = document.createElement("div");
        div_add_bullet.className = "add-bullet";
        div_add_bullet.onclick = function(){
            var x = create_bullet_popup("", "", "-0");
            add_bullet_popup = x;
            add_bullet_new = true;
            update_page_student(curr_student);
        }
        var description_add_bullet = document.createTextNode("Add Bullet");
        div_add_bullet.appendChild(description_add_bullet);
        var div_to_classroom = document.createElement("div");
        var description_to_classroom = document.createTextNode("Go To Classroom");
        div_to_classroom.appendChild(description_to_classroom);
        div_to_classroom.className = "go-to-classroom";
        div_to_classroom.onclick = function(){
            go_to_classroom();
        }
        var div_completion = document.createElement("div");
        var s = classroom.get_single_student(curr_student);
        if(s._complete){
            var description_completion = document.createTextNode("Completed");
            div_completion.appendChild(description_completion);
            div_completion.className = "completed-mark";
        } else{
            var description_completion = document.createTextNode("Incomplete");
            div_completion.appendChild(description_completion);
            div_completion.className = "incompleted-mark";
        }
        div_completion.onclick = function(){
            set_student_status();
        }
        var div_save_progress = document.createElement("div");
        var description_save_progress = document.createTextNode("Save Progress");
        div_save_progress.appendChild(description_save_progress);
        div_save_progress.className = "save-progress";
        div_save_progress.onclick = function(){
            save_progress();
        }
        
        div_menu.appendChild(div_add_bullet);
        div_menu.appendChild(div_to_classroom);
        div_menu.appendChild(div_completion);
        div_menu.appendChild(div_save_progress);
        return div_menu
    }
    
    function save_bullet_edit(question, score, content){
        add_bullet_popup = null;
        bullet_popup_save = [question, score, content];
        update_page_student(curr_student);
    }
    
    function save_student_edit(name_new){
        add_student_popup = null;
        student_popup_save = name_new;
        render_classroom();
    }
    
    function save_score_edit(score_new){
        add_score_popup = null;
        score_popup_save = score_new;
        render_classroom();
    }
    
    function save_comment_edit(comment){
        add_comment_popup = null;
        comment_popup_save = comment;
        update_page_student(curr_student);
    }
    
    function cancel_bullet_edit(){
        bullet_popup_save = null;
        add_bullet_popup = null;
        update_page_student(curr_student);
    }
    
    function cancel_student_edit(){
        student_popup_save = null;
        add_student_popup = null;
        render_classroom();
    }
    
    function cancel_score_edit(){
        score_popup_save = null;
        add_score_popup = null;
        render_classroom();
    }
    
    function cancel_comment_edit(){
        comment_popup_save = null;
        add_comment_popup = null;
        update_page_student(curr_student);
    }
    
    function save_progress(){
        data = classroom.output_for_file();
        var bb = new Blob([data], {type: 'text/plain'});
        var a = document.createElement('a');
        a.download = 'Output.txt';
        a.href = window.URL.createObjectURL(bb);
        a.click();
        console.log(data);
    }
    
    function create_bullet_popup(question = "", content = "", score = "-0"){
        var div = document.createElement("div");
        div.className = "add-change-bullet";
        var title = document.createElement("h3");
        var description_title = document.createTextNode("Add/Change Bullet");
        title.appendChild(description_title);
        
        var label_question = document.createElement("label");
        var label_score = document.createElement("label");
        var label_content = document.createElement("label");
        var bold_question = document.createElement("b");
        var bold_score = document.createElement("b");
        var bold_content = document.createElement("b");
        var description_question = document.createTextNode("Question");
        var description_score = document.createTextNode("Score");
        var description_content = document.createTextNode("Content");
        bold_question.appendChild(description_question);
        bold_score.appendChild(description_score);
        bold_content.appendChild(description_content);
        label_question.appendChild(bold_question);
        label_score.appendChild(bold_score);
        label_content.appendChild(bold_content);
        
        var input_question = document.createElement("input");
        input_question.type = "text";
        input_question.id = "input-question";
        input_question.placeholder = "Enter the question number";
        input_question.value = question;
        var input_score = document.createElement("input");
        input_score.type = "text";
        input_score.id = "input-score";
        input_score.placeholder = "Enter the score to deduct (e.g. -5)";
        input_score.value = score;
        var input_content = document.createElement("input");
        input_content.type = "text";
        input_content.id = "input-content";
        input_content.placeholder = "Enter a short description of the bullet";
        input_content.value = content;
        
        var div_submit = document.createElement("div");
        div_submit.className = "add-bullet-submit";
        var div_save = document.createElement("div");
        div_save.className = "add-bullet-save";
        div_save.onclick = function(){
            var q = $("input-question").value.trim();
            var s = $("input-score").value.trim();
            var c = $("input-content").value.trim();
            if(q.length == 0 || c.length == 0 || s.length == 0){
                alert("All fields must not be empty!");
            } else{
                var sent = classroom._rubric.check_duplicate(c);
                if(confirm("Ready to submit?\nThe most similar rubric is: " + sent)){
                    save_bullet_edit(q, s, c);
                    if(add_bullet_new){
                        classroom.add_bullet(q, c, s);
                    } else{
                        classroom._rubric.editBullet(bullet_edit_id, q, c, s);
                        bullet_edit_id = null;
                    }
                }
            }
            bullet_popup_save = null;
            update_page_student(curr_student);
        }
        var description_save = document.createTextNode("Save");
        div_save.appendChild(description_save);
        var div_cancel = document.createElement("div");
        div_cancel.className = "add-bullet-cancel";
        div_cancel.onclick = function(){
            cancel_bullet_edit();
        }
        var description_cancel = document.createTextNode("Cancel");
        div_cancel.appendChild(description_cancel);
        div_submit.appendChild(div_save);
        div_submit.appendChild(div_cancel);
        
        var div_question = document.createElement("div");
        div_question.className = "add-bullet-input";
        var div_score = document.createElement("div");
        div_score.className = "add-bullet-input";
        var div_content = document.createElement("div");
        div_content.className = "add-bullet-input";
        div_question.appendChild(label_question);
        div_question.appendChild(input_question);
        div_score.appendChild(label_score);
        div_score.appendChild(input_score);
        div_content.appendChild(label_content);
        div_content.appendChild(input_content);
        
        div.appendChild(title);
        div.appendChild(div_question);
        div.appendChild(div_score);
        div.appendChild(div_content);
        div.appendChild(div_submit);
        return div
    }
    
    function render_student(s){
        // TODO: Implement it.
        // Print all items in the rubric
        // Highlight the ones that are selected for this student
        // Display comments if present
        // Print additional comments if not empty
        var body = document.createElement("div");
        body.className = "student";
        var menu = create_student_menu();
        body.appendChild(menu);
        var header = create_name_header(s._name, s._score);
        body.appendChild(header);
        if(add_bullet_popup !== null){
            body.appendChild(add_bullet_popup);
        }
        if(add_comment_popup !== null){
            body.appendChild(add_comment_popup);
        }
        var rubric = document.createElement("div");
        rubric.className = "rubric";
        var bullet_lst = [];
        for(const [mistake, val] of s._rubric._bullet_map.entries()){
            bullet_lst.push({"mistake": mistake, "val": val});
        }
        bullet_lst.sort(function(a, b){
            if(a.val._question < b.val._question){
                return -1;
            } else if(a.val._question > b.val._question){
                return 1;
            } else{
                if(parseFloat(a.val._score) !== parseFloat(b.val._score)){
                    return parseFloat(a.val._score) - parseFloat(b.val._score);
                } else{
                    if(a.val._content < b.val._content){
                        return -1;
                    } else if(a.val._content > b.val._content){
                        return 1;
                    }
                    return 0;
                }
            }
        });
        for(var i = 0; i < bullet_lst.length; i++){
            var mistake = bullet_lst[i].mistake;
            var val = bullet_lst[i].val;
            var class_name = "bullet";
            if(s._mistakes.has(mistake)){
                class_name = "bullet-selected";
            }
            var block = create_bullet_block(s._name, mistake, val, class_name);
            var div_both = document.createElement("div");
            div_both.className = "bullet-super";
            div_both.appendChild(block);
            var comment_div = document.createElement("div");
            comment_div.className = "bullet-comment-content";
            var comment = "";
            if(s._mistakes.has(mistake)){
                comment = s._mistakes.get(mistake);
                if(comment === null){
                    comment = "";
                }
            }
            var comment_p = document.createElement("p");
            comment_p.className = "bullet-comment";
            var description_comment = document.createTextNode("Comment: " + comment);
            comment_p.appendChild(description_comment);
            comment_div.appendChild(comment_p);
            div_both.appendChild(comment_div);
            rubric.appendChild(div_both);
        }
        body.appendChild(rubric);
        
        var h = document.createElement("h2");
        var comment = s.comment;
        h.onclick = function(){
            var x = create_comment_popup(comment);
            add_comment_popup = x;
            update_page_student(curr_student);
        }
        var b = document.createElement("b");
        b.textContent = name;
        var st = document.createTextNode("Final Words:");
        h.appendChild(b);
        h.appendChild(st);
        h.className = "student-header";
        body.appendChild(h);
        
        var comment_div = document.createElement("div");
        comment_div.className = "comment-content";
        var comment_p = document.createElement("p");
        comment_p.className = "comment";
        var description_comment = document.createTextNode(comment);
        comment_p.appendChild(description_comment);
        comment_div.appendChild(comment_p);
        body.appendChild(comment_div);
        return body
    }
    
    function update_page_student(curr_student){
        classroom.get_single_student(curr_student).update_score();
        curr_body = render_student(classroom.get_single_student(curr_student));
        $("body").textContent = "";
        $("body").appendChild(curr_body);
    }
    
    function create_classroom_menu(){
        // Add Student, Change full score, Save progress, Report
        var div_menu = document.createElement("div");
        div_menu.className = "classroom-menu";
        var div_add_student = document.createElement("div");
        div_add_student.className = "add-student";
        div_add_student.onclick = function(){
            add_student_new = true;
            var x = create_student_popup("");
            add_student_popup = x;
            render_classroom();
        }
        var description_add_student = document.createTextNode("Add Student");
        div_add_student.appendChild(description_add_student);
        
        var div_change_fullscore = document.createElement("div");
        var description_change_fullscore = document.createTextNode("Change Total Score");
        div_change_fullscore.appendChild(description_change_fullscore);
        div_change_fullscore.className = "change-fullscore";
        div_change_fullscore.onclick = function(){
            var x = create_score_popup(classroom._fullScore);
            add_score_popup = x;
            render_classroom();
        }
        
        var div_save_progress = document.createElement("div");
        var description_save_progress = document.createTextNode("Save Progress");
        div_save_progress.appendChild(description_save_progress);
        div_save_progress.className = "save-progress";
        div_save_progress.onclick = function(){
            save_progress();
        }
        
        var div_report = document.createElement("div");
        var description_report = document.createTextNode("Report");
        div_report.appendChild(description_report);
        div_report.className = "report";
        div_report.onclick = function(){
            render_report();
        }
        
        div_menu.appendChild(div_add_student);
        div_menu.appendChild(div_change_fullscore);
        div_menu.appendChild(div_save_progress);
        div_menu.appendChild(div_report)
        return div_menu
    }
    
    function create_report_menu(){
        // Add Student, Change full score, Save progress, Report
        var div_menu = document.createElement("div");
        div_menu.className = "report-menu";
        
        var div_to_classroom = document.createElement("div");
        var description_to_classroom = document.createTextNode("Go To Classroom");
        div_to_classroom.appendChild(description_to_classroom);
        div_to_classroom.className = "go-to-classroom-report";
        div_to_classroom.onclick = function(){
            go_to_classroom();
        }
        
        div_menu.appendChild(div_to_classroom);
        return div_menu
    }
    
    function create_student_popup(name = ""){
        var div = document.createElement("div");
        div.className = "add-change-student";
        var title = document.createElement("h3");
        var description_title = document.createTextNode("Add/Change Student");
        title.appendChild(description_title);
        
        var label_name = document.createElement("label");
        var bold_name = document.createElement("b");
        var description_name = document.createTextNode("Name");
        bold_name.appendChild(description_name);
        label_name.appendChild(bold_name);
        
        var input_name = document.createElement("input");
        input_name.type = "text";
        input_name.id = "input-name";
        input_name.placeholder = "Enter the student name";
        input_name.value = name;
        
        var div_submit = document.createElement("div");
        div_submit.className = "add-student-submit";
        var div_save = document.createElement("div");
        div_save.className = "add-student-save";
        div_save.onclick = function(){
            var n = $("input-name").value.trim();
            if(n.length == 0){
                alert("All fields must not be empty!");
            } else{
                if(confirm("Ready to submit?")){
                    save_student_edit(n);
                    if(add_student_new){
                        classroom.add_student(n);
                    } else{
                        classroom.change_student_name(name, n);
                    }
                }
            }
            student_popup_save = null;
            render_classroom();
        }
        var description_save = document.createTextNode("Save");
        div_save.appendChild(description_save);
        var div_cancel = document.createElement("div");
        div_cancel.className = "add-student-cancel";
        div_cancel.onclick = function(){
            cancel_student_edit();
        }
        var description_cancel = document.createTextNode("Cancel");
        div_cancel.appendChild(description_cancel);
        div_submit.appendChild(div_save);
        div_submit.appendChild(div_cancel);
        
        var div_name = document.createElement("div");
        div_name.className = "add-student-input";
        div_name.appendChild(label_name);
        div_name.appendChild(input_name);
        
        div.appendChild(title);
        div.appendChild(div_name);
        div.appendChild(div_submit);
        return div
    }
    
    function create_score_popup(score = 100){
        var div = document.createElement("div");
        div.className = "add-change-score";
        var title = document.createElement("h3");
        var description_title = document.createTextNode("Change Full Score");
        title.appendChild(description_title);
        
        var label_name = document.createElement("label");
        var bold_name = document.createElement("b");
        var description_name = document.createTextNode("Full Score");
        bold_name.appendChild(description_name);
        label_name.appendChild(bold_name);
        
        var input_name = document.createElement("input");
        input_name.type = "text";
        input_name.id = "input-score";
        input_name.placeholder = "Enter the full score";
        input_name.value = score;
        
        var div_submit = document.createElement("div");
        div_submit.className = "add-score-submit";
        var div_save = document.createElement("div");
        div_save.className = "add-score-save";
        div_save.onclick = function(){
            var new_score = $("input-score").value.trim();
            if(new_score.length == 0){
                alert("All fields must not be empty!");
            } else{
                if(confirm("Ready to submit?")){
                    new_score = parseFloat(new_score);
                    save_score_edit(new_score);
                    classroom.update_full_score(new_score);
                }
            }
            score_popup_save = null;
            render_classroom();
        }
        var description_save = document.createTextNode("Save");
        div_save.appendChild(description_save);
        var div_cancel = document.createElement("div");
        div_cancel.className = "add-score-cancel";
        div_cancel.onclick = function(){
            cancel_score_edit();
        }
        var description_cancel = document.createTextNode("Cancel");
        div_cancel.appendChild(description_cancel);
        div_submit.appendChild(div_save);
        div_submit.appendChild(div_cancel);
        
        var div_name = document.createElement("div");
        div_name.className = "add-score-input";
        div_name.appendChild(label_name);
        div_name.appendChild(input_name);
        
        div.appendChild(title);
        div.appendChild(div_name);
        div.appendChild(div_submit);
        return div
    }
    
    function create_comment_popup(comment = ""){
        var div = document.createElement("div");
        div.className = "add-change-comment";
        var title = document.createElement("h3");
        var description_title = document.createTextNode("Edit Comment");
        title.appendChild(description_title);
        
        var label_name = document.createElement("label");
        var bold_name = document.createElement("b");
        var description_name = document.createTextNode("Comment");
        bold_name.appendChild(description_name);
        label_name.appendChild(bold_name);
        
        var input_name = document.createElement("textarea");
        input_name.id = "input-comment";
        input_name.value = comment;
        
        var div_submit = document.createElement("div");
        div_submit.className = "add-comment-submit";
        var div_save = document.createElement("div");
        div_save.className = "add-comment-save";
        div_save.onclick = function(){
            var new_comment = $("input-comment").value.trim();
            if(confirm("Ready to submit?")){
                save_comment_edit(new_comment);
                if(bullet_edit_id !== null){
                    add_bullet_comment(bullet_edit_id, new_comment);
                    bullet_edit_id = null;
                } else{
                    classroom.get_single_student(curr_student).comment = new_comment;
                }
            }
            comment_popup_save = null;
            update_page_student(curr_student);
        }
        var description_save = document.createTextNode("Save");
        div_save.appendChild(description_save);
        var div_cancel = document.createElement("div");
        div_cancel.className = "add-comment-cancel";
        div_cancel.onclick = function(){
            cancel_comment_edit();
        }
        var description_cancel = document.createTextNode("Cancel");
        div_cancel.appendChild(description_cancel);
        div_submit.appendChild(div_save);
        div_submit.appendChild(div_cancel);
        
        var div_name = document.createElement("div");
        div_name.className = "add-comment-input";
        div_name.appendChild(label_name);
        div_name.appendChild(input_name);
        
        div.appendChild(title);
        div.appendChild(div_name);
        div.appendChild(div_submit);
        return div
    }
    
    function create_student_block(name, score, class_name){
        var div = document.createElement("div");
        div.className = class_name;
        var div_name = document.createElement("div");
        div_name.className = "student-name";
        div_name.textContent = name + " " + score + "/" + classroom._fullScore;
        var div_edit = document.createElement("div");
        var description_edit = document.createTextNode("Edit");
        div_edit.appendChild(description_edit);
        div_edit.className = "student-edit";
        var div_delete = document.createElement("div");
        var description_delete = document.createTextNode("Delete");
        div_delete.appendChild(description_delete);
        div_delete.className = "student-delete";
        
        div_name.onclick = function(){
            in_classroom = false;
            curr_student = name;
            update_page_student(name);
        }
        
        div_delete.onclick = function(){
            classroom.remove_student(name);
            render_classroom();
        }
        
        div_edit.onclick = function(){
            add_student_new = false;
            var x = create_student_popup(name);
            add_student_popup = x;
            render_classroom();
        }
        
        div.appendChild(div_name);
        div.appendChild(div_edit);
        div.appendChild(div_delete);
        return div;
    }
    
    function get_score_metrics(){
        var arr = [];
        for(const [name, s] of classroom._students.entries()){
            if(s._complete){
                arr.push(s.get_score());
            }
        }
        var median = "n/a";
        var max = "n/a";
        var min = "n/a";
        var avg = "n/a";
        if(arr.length > 0){
            arr = [...arr].sort((a, b) => a - b);
            var middle = Math.floor(arr.length / 2);
            median = arr.length % 2 !== 0 ? arr[middle] : (arr[middle - 1] + arr[middle]) / 2;
            max = Math.max(...arr);
            min = Math.min(...arr);
            avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100.0;
        }
        var ret = "Avg: " + avg + ",\t\tMedian: " + median + ",\t\tMax: " + max + ",\t\tMin: " + min;
        return ret;
    }
    
    function render_classroom(){
        var body = document.createElement("div");
        body.className = "classroom";
        var menu = create_classroom_menu();
        body.appendChild(menu);

        var header = document.createElement("div");
        header.className = "classroom-header";
        var title = document.createElement("h2");
        title.textContent = "Classroom";
        var metrics = document.createElement("h3");
        metrics.textContent = get_score_metrics();
        header.appendChild(title);
        header.appendChild(metrics);
        body.appendChild(header);
        
        if(add_student_popup !== null){
            body.appendChild(add_student_popup);
        }
        
        if(add_score_popup !== null){
            body.appendChild(add_score_popup);
        }
        
        var room = document.createElement("div");
        room.className = "room";
        for(const [name, s] of classroom._students.entries()){
            var class_name = "incompleted-student";
            if(s._complete){
                class_name = "completed-student";
            }
            var block = create_student_block(s._name, s.get_score(), class_name);
            room.appendChild(block);
        }
        body.appendChild(room);
        
        $("body").textContent = "";
        $("body").appendChild(body);
    }
    
    function go_to_classroom(){
        in_classroom = true;
        curr_student = "";
        render_classroom();
    }
                             
    function bar_chart(x_lst, y_lst, title){
        var combo = [];
        for(var i = 0; i < x_lst.length; i++){
            combo.push({"question": y_lst[i], "val": x_lst[i]});
        }
        combo.sort((a, b) => b.val - a.val);
        var x_lst_sorted = [];
        var y_lst_sorted = [];
        for(var i = 0; i < combo.length; i++){
            x_lst_sorted.push(combo[i].val);
            y_lst_sorted.push(combo[i].question);
        }
        new Chart("barChart", {
            type: "bar",
            data: {
                labels: x_lst_sorted,
                datasets: [{
                    data: y_lst_sorted,
                }]
            },
            options: {
                title: {
                    display: true,
                    text: title
                },
                legend: {display: false}
            }
        });
    }
                             
    function wildcard_match(wildcard, str){
        // The wildcard can only contain up to one "*"
        var wildcard = wildcard.trim().toLowerCase();
        var str = str.trim().toLowerCase();
        if(wildcard.length == 0){
            return wildcard === str;
        }
        for(var i = 0; i < wildcard.length; i++){
            if(wildcard.charAt(i) !== "*"){
                if(wildcard.charAt(i) !== str.charAt(i)){
                    return false;
                }
            } else{
                var len = wildcard.length - i - 1;
                if(i == wildcard.length - 1){
                    return true;
                }
                return wildcard.substring(i + 1) === str.substring(str.length - len + 1);
            }
        }
        return wildcard.length == str.length;
    }
                             
    function summarize_mistakes(wildcard){
        var error_compendium = new Map();
        for(const [name, s] of classroom.students.entries()){
            for(const [id, val] of s.mistakes.entries()){
                var error = classroom._rubric.getBullet(id);
                if(wildcard_match(wildcard, error.question)){
                    if(!error_compendium.has(id)){
                        error_compendium.set(id, 0);
                    }
                    error_compendium.set(id, error_compendium.get(id) + 1);
                }
            }
        }
        var lst = [];
        for(const [id, cnt] of error_compendium.entries()){
            lst.push({"id": id, "cnt": cnt});
        }
        lst.sort((a, b) => b.cnt - a.cnt);
        return lst;
    }
                             
    function render_report(){
        var body = document.createElement("body");
        body.className = "report-page";
        var menu = create_report_menu();
        body.appendChild(menu);
                
        var div_header = document.createElement("div");
        div_header.className = "report-header";
        var div_wildcard = document.createElement("div");
        div_wildcard.className = "report-wildcard";
        var title = document.createElement("h2");
        title.textContent = "Report Wildcard";
        div_wildcard.appendChild(title);
        
        var label_name = document.createElement("label");
        var bold_name = document.createElement("b");
        var description_name = document.createTextNode("Questions To Report:");
        bold_name.appendChild(description_name);
        label_name.appendChild(bold_name);
        
        var input_name = document.createElement("input");
        input_name.type = "text";
        input_name.id = "input-report-question";
        input_name.placeholder = "E.g. Q2*";
        input_name.value = report_wildcard;
        
        div_wildcard.appendChild(label_name);
        div_wildcard.appendChild(input_name);
        
        var div_save = document.createElement("div");
        div_save.className = "report-wildcard-save";
        div_save.onclick = function(){
            var new_wildcard = $("input-report-question").value.trim();
            if(new_wildcard.split("*").length > 2){
                alert("Can only include up to one '*'!");
            } else{
                report_wildcard = new_wildcard;
                render_report();
            }
        }
        var description_save = document.createTextNode("Update View");
        div_save.appendChild(description_save);
                
        div_wildcard.appendChild(div_save);
        div_header.appendChild(div_wildcard);
        body.appendChild(div_header);
        
        var error_compendium = summarize_mistakes(report_wildcard);
        error_compendium.unshift({"id": "n/a", "cnt": "Frequency"});
                
        var div_errors = document.createElement("div");
        div_errors.className = "report-error-list";
                
        for(var i = 0; i < error_compendium.length; i++){
            var id = error_compendium[i].id;
            var cnt = error_compendium[i].cnt;
            var sentence = "Mistake"
            if(id !== "n/a"){
                var error = classroom._rubric.getBullet(id);
                sentence = error.score + ": " + error.question + ". " + cap(error.content);
            }
            var div_error_single = document.createElement("div");
            if(id !== "n/a"){
                div_error_single.className = "report-error-single";
            } else{
                div_error_single.className = "report-error-single-top";
            }
            var div_error_cnt = document.createElement("div");
            div_error_cnt.className = "report-error-cnt";
            div_error_cnt.textContent = cnt;
            var div_error_content = document.createElement("div");
            div_error_content.className = "report-error-content";
            div_error_content.textContent = sentence;
            div_error_single.appendChild(div_error_cnt);
            div_error_single.appendChild(div_error_content);
            div_errors.appendChild(div_error_single);
        }
                
        body.appendChild(div_errors);
                
        $("body").textContent = "";
        $("body").appendChild(body);
    }
    
    function upload_progress(){
        var file_input = document.createElement("input");
        file_input.type = "file";
        file_input.id = "file-input";
        var freader = new FileReader();
        freader.onload = function(){
            var content = freader.result;
            classroom = new Classroom(false, null, content);
            render_classroom();
        }
        file_input.onchange = function(){
            var f = $("file-input").files[0];
            freader.readAsText(f);
        }
        var body = document.createElement("body");
        var div_container = document.createElement("div");
        div_container.className = "upload-container";
        var div = document.createElement("div");
        div.className = "upload-progress";
        var header = document.createElement("h2");
        header.textContent = "Load Saved Progress";
        var file_upload_prompt = document.createTextNode("Please upload the file of your progress: ");
        div.appendChild(header);
        div.appendChild(file_upload_prompt);
        div.appendChild(file_input);
        div_container.appendChild(div);
        body.appendChild(div_container);
        $("body").textContent = "";
        $("body").appendChild(body);
    }
    
    window.onload = function(){
        if(confirm("Create New Classroom?")){
            var fullscore = prompt("Please enter the full score:");
            classroom = new Classroom(true, fullscore, null);
            render_classroom();
        } else{
            upload_progress();
        }
    };
})();
