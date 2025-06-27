using CryptoExchangeReactDotnetPractice.Server.Data;
using CryptoExchangeReactDotnetPractice.Server.DTOs.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CryptoExchangeReactDotnetPractice.Server.Services;

namespace CryptoExchangeReactDotnetPractice.Server.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "admin")]
    public class UsersAdminController : ControllerBase
    {
        private readonly UserService _service;
        public UsersAdminController(UserService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var dtos = await _service.GetAllUsersAsync();
            return Ok(dtos);
        }

        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleDto dto)
        {
            if (!await _service.AssignRoleAsync(id, dto))
                return NotFound("User not found");
            return NoContent();
        }
    }
}

