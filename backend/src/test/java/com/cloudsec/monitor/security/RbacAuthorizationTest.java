package com.cloudsec.monitor.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class RbacAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "viewer@cloudsec.local", roles = {"VIEWER"})
    void viewer_CannotAccessAdminUserList_Returns403Forbidden() throws Exception {
        mockMvc.perform(get("/api/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @WithMockUser(username = "analyst@cloudsec.local", roles = {"ANALYST"})
    void analyst_CannotAccessAdminUserList_Returns403Forbidden() throws Exception {
        mockMvc.perform(get("/api/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @WithMockUser(username = "admin@cloudsec.local", roles = {"ADMIN"})
    void admin_CanAccessAdminUserList_Returns200Ok() throws Exception {
        mockMvc.perform(get("/api/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "analyst@cloudsec.local", roles = {"ANALYST"})
    void analyst_CanReadShifts_Returns200Ok() throws Exception {
        mockMvc.perform(get("/api/shifts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "viewer@cloudsec.local", roles = {"VIEWER"})
    void viewer_CannotReadShifts_Returns403Forbidden() throws Exception {
        mockMvc.perform(get("/api/shifts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "analyst@cloudsec.local", roles = {"ANALYST"})
    void analyst_CannotCreateShift_Returns403Forbidden() throws Exception {
        String shiftJson = """
                {
                    "userId": "00000000-0000-0000-0000-000000000001",
                    "startsAt": "2026-10-25T08:00:00Z",
                    "endsAt": "2026-10-25T16:00:00Z"
                }
                """;

        mockMvc.perform(post("/api/shifts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(shiftJson))
                .andExpect(status().isForbidden());
    }
}
