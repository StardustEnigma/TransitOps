package com.transitops_backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller to redirect all non-API and non-static-file requests to index.html.
 * This enables React Router client-side routing to work seamlessly when page is refreshed.
 */
@Controller
public class SpaRedirectController {

    @RequestMapping(value = "/{path:^(?!api)[a-zA-Z0-9-_]+}/**")
    public String redirect() {
        return "forward:/index.html";
    }
}
