var Type;
(function (Type) {
    Type[Type["TEXT"] = 0] = "TEXT";

    Type[Type["EXPR"] = 1] = "EXPR";
    Type[Type["SAFE_EXPR"] = 2] = "SAFE_EXPR";

    Type[Type["OPERATOR"] = 3] = "OPERATOR";

    Type[Type["NUMBER"] = 4] = "NUMBER";
    Type[Type["STRING"] = 5] = "STRING";
    Type[Type["BOOLEAN"] = 6] = "BOOLEAN";
    Type[Type["NIL"] = 7] = "NIL";
    Type[Type["NAME"] = 8] = "NAME";
    Type[Type["TMPL"] = 9] = "TMPL";
    Type[Type["FUNC"] = 10] = "FUNC";
    Type[Type["MAP"] = 11] = "MAP";
    Type[Type["ARG"] = 12] = "ARG";

    Type[Type["TOKEN"] = 13] = "TOKEN";

    Type[Type["OPEN_BRACKET"] = 14] = "OPEN_BRACKET";
    Type[Type["CLOSE_BRACKET"] = 15] = "CLOSE_BRACKET";
    Type[Type["OPEN_PARENTHESIS"] = 16] = "OPEN_PARENTHESIS";
    Type[Type["CLOSE_PARENTHESIS"] = 17] = "CLOSE_PARENTHESIS";

    Type[Type["OPEN_TAG_START"] = 18] = "OPEN_TAG_START";
    Type[Type["OPEN_TAG_END"] = 19] = "OPEN_TAG_END";
    Type[Type["CLOSE_TAG"] = 20] = "CLOSE_TAG";
    Type[Type["ATTR_NAME"] = 21] = "ATTR_NAME";
    Type[Type["ATTR_START"] = 22] = "ATTR_START";
    Type[Type["ATTR_END"] = 23] = "ATTR_END";
    Type[Type["EXPR_START"] = 24] = "EXPR_START";
    Type[Type["EXPR_END"] = 25] = "EXPR_END";
})(Type || (Type = {}));
